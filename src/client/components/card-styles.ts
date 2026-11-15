// 枠のカードで共通に使うスタイル。リストのカード（UnitCard・BlockCard）と、横並び表示のカード（GridView）で使う。
// ステージの色は、要素の style で渡した --stage を使う

import { css } from "hono/jsx/dom/css";

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

/** 進行中の枠。枠線を強調する */
export const cardLive = css`
  box-shadow: 0 0 0 2px var(--accent);
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
