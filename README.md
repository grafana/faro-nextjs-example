# Grafana Cloud example for Next.js

This example uses next.js, OpenTelemetry and Grafana Faro
to produce telemetry signals to make them available for observation
in Grafana Cloud Frontend Observability for Real User Monitoring (RUM) and
Grafana Cloud Application Observability for Application Performance Monitoring (APM).

## Requirements

* Node.js >20
* docker compose

## Running the example

To run the example, follow these steps:

1. Create a Frontend Observability app in Grafana Cloud
2. Enable Application Observability in Grafana Cloud
3. Enable Client Apps in Frontend Observability in Grafana Cloud
4. Clone the repository
5. Install the dependencies with `npm install`
6. Set the environment variables in the `.env` file in the root of the project to match your Grafana Cloud instance. You can find the Frontend App URL in the Grafana Cloud UI of your Frontend Observability app. You can find the OTLP endpoint and credentials in the Grafana.com "my account" section or the connections console.
7. Start the otel collector with `docker-compose up`
8. run the example with `npm run dev`
9. Open the example in your browser at `http://localhost:3000`

## Setup

In order to enable observe your next.js project with Grafana Cloud, the following 4 steps are needed:

1. enable the instrumentation hook
2. create and conigure your backend instrumentation
3. add frontend instrumentation
4. enable configuration needed at runtime

### 1. Enable the instrumentation hook

You _must_ enable the instrumentation through your `next.config.js` file.

```javascript
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};
```

### 2. Create and configure backend instrumentation

Install the required packages:

```bash
npm install @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation
```

Create a new file `instrumentation.ts` in the root of your project. This file will contain the configuration for the OpenTelemetry instrumentation for the nodejs backend of your app.

It contains a few defaults and a custom span processor to reduce the cardinality of span names.

```typescript
import { Context } from "@opentelemetry/api";
import { ReadableSpan, Span, SpanProcessor } from "@opentelemetry/sdk-trace-node";
import { registerOTel } from "@vercel/otel";

/**
 * Span processor to reduce cardinality of span names.
 *
 * Customize with care!
 */
class SpanNameProcessor implements SpanProcessor {
    forceFlush(): Promise<void> {
        return Promise.resolve();
    }
    onStart(span: Span, parentContext: Context): void {
        if (span.name.startsWith("GET /_next/static")) {
            span.updateName("GET /_next/static");
        } else if (span.name.startsWith("GET /_next/data")) {
            span.updateName("GET /_next/data");
        } else if (span.name.startsWith("GET /_next/image")) {
            span.updateName("GET /_next/image");
        }
    }
    onEnd(span: ReadableSpan): void {
    }
    shutdown(): Promise<void> {
        return Promise.resolve();
    }
}

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || "unknown_service:node",
    spanProcessors: [
        "auto",
        new SpanNameProcessor(),
    ],
  });
}
```

Create a `middleware.ts` file in the root of your app to enable strong correlation between frontend and backend spans. This middleware will extract the trace context from the incoming request and inject it into the response headers.

```typescript
import {NextRequest, NextResponse} from 'next/server'
import { trace } from '@opentelemetry/api'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()
    const current = trace.getActiveSpan();

    // set server-timing header with traceparent
    if (current) {
        response.headers.set('server-timing', `traceparent;desc="00-${current.spanContext().traceId}-${current.spanContext().spanId}-01"`)
    }
    return response
}
```

### 3. Add frontend instrumentation

Create a new component `FrontendObservability` in `components/FrontendObservability.tsx`:

```tsx
"use client";

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export default function FrontendObservability(){
  // skip if already initialized
  if (faro.api) {
    return null;
  }

  try {
    const faro = initializeFaro({
      url: 'your-faro-url',
      app: {
        name: 'your-app-name',
        namespace: 'your-namespace',
        version: process.env.VERCEL_DEPLOYMENT_ID,
        environment: process.env.VERCEL_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV
      },

      instrumentations: [
        // Mandatory, omits default instrumentations otherwise.
        ...getWebInstrumentations(),

        // Tracing package to get end-to-end visibility for HTTP requests.
        new TracingInstrumentation(),
      ],
    });

  } catch (e) {return null;}
  return null;
}
```

### 4. Enable configuration needed at runtime

Create or add lines to a `.env` file in the root of your project with the following content:

```bash
## The configuration for the frontend observability instrumentation
## The URL of your Faro instance, can be found in the Grafana Cloud UI
NEXT_PUBLIC_FARO_URL=my-url
## The name of your app, can be found in the Grafana Cloud UI; should be different for your backend and frontend
NEXT_PUBLIC_FARO_APP_NAME=next-frontend
## The namespace of your app, can be chosen by you and should optimally be the same as the namespace of your backend
NEXT_PUBLIC_FARO_APP_NAMESPACE=nextjs-example

# Next App BACKEND Instrumentation
## Example assumes that the collector is running on the same machine
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
## Force protobuf
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
## Set Backend service name
OTEL_SERVICE_NAME=next-backend
## Customize resource attributes, namespace is a recommended attribute, here we set it to the same value as the frontend namespace to enable correlation
OTEL_RESOURCE_ATTRIBUTES=service.namespace=nextjs-example
```
