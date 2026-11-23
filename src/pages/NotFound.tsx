import { cx } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";
import { lead, main, title, wrap } from "../styles.ts";

export const NotFound: FC<{ devClientScript?: string }> = ({ devClientScript }) => (
  <Layout title="ページが見つかりません" devClientScript={devClientScript}>
    <main class={cx(wrap, main)}>
      <h1 class={title}>ページが見つかりません</h1>
      <p class={lead}>URL が間違っているか、ページが削除された可能性があります。</p>
      <p>
        <a href="/">トップへ戻る</a>
      </p>
    </main>
  </Layout>
);
