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

// ---------- 日付の切り替え ----------

/** 日数が多いときは横にスクロールする */
export const dayChips = css`
  display: flex;
  gap: 16px;
  margin: 12px 0 4px;
  overflow-x: auto;
  scrollbar-width: none;
`;

/** 「タイムテーブル / マイテーブル」より軽く見えるよう、枠を付けず下線で選択を示す */
export const dayChip = css`
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 6px;
  padding: 6px 2px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
`;

export const dayChipOn = css`
  border-bottom-color: var(--accent);
  color: var(--ink);
  font-weight: 700;
`;

export const dayChipLabel = css`
  font-size: 0.75rem;
`;

/** その日に選んでいる件数 */
export const dayChipCount = css`
  min-width: 1.5em;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
`;

// ---------- 表示の切り替え ----------

/** スクロールしても切り替えられるよう、上に固定する */
export const views = css`
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--line);
  background: var(--bg);
`;

export const tab = css`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
`;

export const tabOn = css`
  border-color: var(--ink);
  background: var(--ink);
  color: var(--bg);
`;

/** マイテーブルの件数 */
export const count = css`
  display: inline-block;
  min-width: 1.6em;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.8rem;
`;

/** 保存できなかったときなどの知らせ */
export const warning = css`
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  font-size: 0.9rem;
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

// ---------- 選べる単位 ----------

/** カードの中身は button の中にも置けるよう span で組むので、縦に並ぶよう grid にする */
export const card = css`
  position: relative;
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 12px 16px;
  border: 1px solid var(--line);
  border-left: 6px solid var(--stage, var(--line));
  border-radius: 12px;
  background: var(--surface);
`;

/** タップで選べるカード。右に、選んでいるかの印を置く余白を取る */
export const cardButton = css`
  width: 100%;
  padding-right: 52px;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;

/** 選んでいる状態。ステージの色を薄く敷く */
export const cardOn = css`
  border-color: var(--stage, var(--accent));
  background: color-mix(in oklch, var(--stage, var(--accent)) 16%, var(--surface));
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

/** 時間の重なりなどの注意 */
export const flagWarn = css`
  border-color: var(--warn);
  color: var(--warn);
`;

export const check = css`
  position: absolute;
  top: 50%;
  right: 12px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  margin-top: -14px;
  border: 1px solid var(--line);
  border-radius: 50%;
  color: var(--muted);
  font-weight: 700;
`;

export const checkOn = css`
  border-color: var(--stage, var(--accent));
  background: var(--stage, var(--accent));
  color: var(--bg);
`;

// ---------- ブロック ----------

export const block = css`
  gap: 6px;
`;

export const blockNote = css`
  color: var(--muted);
  font-size: 0.8rem;
`;

/** ブロックの中のトーク1本。タップで選べる */
export const talk = css`
  position: relative;
  display: grid;
  gap: 2px;
  width: 100%;
  padding: 8px 52px 8px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--bg);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
`;

export const talkTitle = css`
  font-weight: 700;
  line-height: 1.35;
`;

// ---------- マイテーブル ----------

export const stack = css`
  display: grid;
  gap: 8px;
  padding: 12px 0;
`;

export const emptyBox = css`
  margin: 0;
  padding: 32px 16px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  color: var(--muted);
  text-align: center;
`;

export const note = css`
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.8rem;
`;
