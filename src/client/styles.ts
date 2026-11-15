// ブラウザ側の、画面全体で使うスタイル（hono/css の DOM 版）。
// 1つの UI でしか使わないスタイルはそのコンポーネントのファイルに、
// 特定の UI の仲間うちで使うスタイルはその近く（カードは components/card-styles.ts）に置く。
// 色の変数（--bg、--ink など）は、サーバー側の globalClass（src/styles.ts）で定義している

import { css } from "hono/jsx/dom/css";

export const muted = css`
  color: var(--muted);
`;

export const empty = css`
  margin: 0;
  color: var(--muted);
`;

/** 書き出し・読み込みなどの操作 */
export const actions = css`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const action = css`
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: inherit;
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
`;

/** いちばん使ってほしい操作 */
export const actionPrimary = css`
  border-color: var(--accent);
  background: var(--accent);
  color: var(--accent-ink);
  text-decoration: none;
`;
