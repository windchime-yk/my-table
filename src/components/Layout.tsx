import { Style, css, cx } from "hono/css";
import type { FC, PropsWithChildren } from "hono/jsx";
import { globalClass, wrap } from "../styles.ts";

const footer = css`
  padding: 20px 0 32px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.8rem;
`;

const footerInner = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
`;

const SITE_NAME = "マイテーブル";
const REPOSITORY_URL = "https://github.com/windchime-yk/my-table";

export const Layout: FC<PropsWithChildren<{ title?: string }>> = ({ title, children }) => (
  <html lang="ja">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      <meta
        name="description"
        content="フェスやカンファレンスのタイムテーブルから、自分だけのマイテーブルを作る非公式ツール"
      />
      {/* 非公式ツールのため、検索エンジンには載せない */}
      <meta name="robots" content="noindex" />
      <title>{title ? `${title} | ${SITE_NAME}` : SITE_NAME}</title>
      <Style />
    </head>
    <body class={globalClass}>
      {children}
      <footer class={footer}>
        <div class={cx(wrap, footerInner)}>
          <span>© 2026 WhyK</span>
          <a href={REPOSITORY_URL}>GitHub</a>
        </div>
      </footer>
    </body>
  </html>
);
