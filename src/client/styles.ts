// ブラウザ側のスタイル（hono/css の DOM 版）。
// 色の変数（--bg、--ink など）は、サーバー側の globalClass（src/styles.ts）で定義している。
// ステージの色は、要素の style で渡した --stage を使う

import { css } from "hono/jsx/dom/css";

export const muted = css`
  color: var(--muted);
`;

export const empty = css`
  margin: 0;
  color: var(--muted);
`;

/** 表示している日（表示名と日付） */
export const dayLine = css`
  margin: 16px 0 8px;
  font-weight: 700;
`;

// ---------- ステージの絞り込み ----------

/** 数が多いときは横にスクロールする */
export const chips = css`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  overflow-x: auto;
  scrollbar-width: none;
`;

export const chip = css`
  flex: none;
  padding: 6px 12px;
  border: 1px solid var(--stage, var(--line));
  border-radius: 999px;
  background: var(--surface);
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
`;

export const chipOn = css`
  background: var(--stage, var(--ink));
  color: var(--bg);
  font-weight: 700;
`;

// ---------- リスト ----------

export const group = css`
  display: grid;
  gap: 8px;
  padding: 12px 0;
`;

export const groupTime = css`
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
`;

export const dayEvent = css`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  padding: 8px 12px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  font-size: 0.85rem;
`;

// ---------- 枠 ----------

export const card = css`
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-left: 6px solid var(--stage, var(--line));
  border-radius: 12px;
  background: var(--surface);

  & p {
    margin: 0;
  }
`;

export const cardHead = css`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 8px;
  font-size: 0.8rem;
`;

export const cardTime = css`
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

export const cardStage = css`
  font-weight: 700;
`;

export const cardTitle = css`
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.35;
`;

export const cardSub = css`
  color: var(--muted);
  font-size: 0.85rem;
`;

export const flags = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

export const flag = css`
  padding: 1px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.75rem;
`;

// ---------- ブロック ----------

export const block = css`
  gap: 6px;
`;

export const blockNote = css`
  color: var(--muted);
  font-size: 0.8rem;
`;

export const talks = css`
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 1.4em;
`;

export const talk = css`
  & > span {
    display: block;
  }
`;
