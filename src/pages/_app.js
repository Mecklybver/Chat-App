import { Plus_Jakarta_Sans } from "next/font/google";
import Head from "next/head";
import "src/styles/globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
});

export default function App({ Component, pageProps }) {
  return (
    <main className={plusJakartaSans.className}>
      <Head>
        <title>EpicChat</title>
        <link rel="icon" href="/favicon.ico?v=1" type="image/x-icon" />
      </Head>
      <Component {...pageProps} />
    </main>
  );
}
