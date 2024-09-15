import FrontendObservability from "./frontend-observability";

export default function Layout({ children }) {
  return (
    <>
      <FrontendObservability />
      <main>{children}</main>
    </>
  );
}
