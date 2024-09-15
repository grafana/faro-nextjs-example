import Head from "next/head";
import styles from "../styles/Home.module.css";

import Layout from "../components/layout";
import RepoList from "../components/repo-list";

import { fetchGithubStars } from "../shared/fetchGithubStars";

export default async function Page() {
  const stars = await fetchGithubStars("vercel/next.js");

  return (
    <Layout>
      <div className={styles.container}>
        <Head>
          <title>Create Next App</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main>
          <h1 className={styles.title}>
            Welcome to <a href="https://nextjs.org">Next.js</a> with Grafana Cloud!
          </h1>

          <p className={styles.description}>
            Next.js has {stars} ⭐️ on Github!
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
