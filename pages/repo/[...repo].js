import { fetchGithubStars } from "../../shared/fetchGithubStars";
import Layout from "../../components/Layout";
import Head from "next/head";
import styles from "../../styles/Home.module.css";
import opentelemetry from "@opentelemetry/api";

import RepoList from "../../components/repo-list";

export async function getServerSideProps(context) {
  const stars = await fetchGithubStars(context.query.repo.join("/"));
  return {
    props: {
      stars,
      repo: context.query.repo.join("/"),
    },
  };
}

export default function RepoDetailsPage({ stars, repo }) {
  opentelemetry.trace
    .getActiveSpan()
    ?.setAttribute("repo.name", repo)
    ?.setAttribute("repo.stars", stars);

  return (
    <Layout>
      <div className={styles.container}>
        <Head>
          <title>Create Next App</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <h1 className={styles.title}>
            Welcome to{" "}
            Welcome to <a href="https://nextjs.org">Next.js</a> with Grafana Cloud!
          </h1>

          <p className={styles.description}>
            {repo} has {stars} ⭐️ on Github!
          </p>

          <RepoList />
        </main>

        <footer>
          <a
            href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by{" "}
            <img src="/vercel.svg" alt="Vercel" className={styles.logo} />
          </a>
        </footer>
      </div>
    </Layout>
  );
}
