import { css } from "hono/css";

/**
 * 全体テーマ。色は CSS 変数で定義し、ダーク・ライトを OS の設定に合わせて切り替える。
 * 色は OKLCH（明度・彩度・色相）で書く。無彩色寄りの色は色相を 255 にそろえる
 */
export const globalClass = css`
  :-hono-global {
    :root {
      --bg: oklch(16.8% 0.007 255);
      --surface: oklch(21.7% 0.011 255);
      --ink: oklch(96.6% 0.005 255);
      --muted: oklch(71.1% 0.018 255);
      --line: oklch(30.3% 0.014 255);
      --accent: oklch(83.5% 0.21 130);
      --accent-ink: oklch(16.8% 0.007 255);
      --warn: oklch(82% 0.15 75);
      color-scheme: dark;
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: oklch(97.6% 0.003 255);
        --surface: oklch(100% 0 0);
        --ink: oklch(20.3% 0.008 255);
        --muted: oklch(50.6% 0.019 255);
        --line: oklch(90.8% 0.008 255);
        --accent: oklch(56.9% 0.162 133);
        --accent-ink: oklch(100% 0 0);
        --warn: oklch(52% 0.13 65);
        color-scheme: light;
      }
    }

    * {
      box-sizing: border-box;
    }

    html {
      -webkit-text-size-adjust: 100%;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", system-ui, sans-serif;
      line-height: 1.7;
    }

    a {
      color: inherit;
    }
  }
`;

export const wrap = css`
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px;
`;

/** 上下の余白だけを持つ。左右の余白は wrap と組み合わせて付く */
export const main = css`
  padding-block: 40px 56px;
`;

export const title = css`
  margin: 0 0 12px;
  font-size: 1.75rem;
  line-height: 1.3;
`;

export const lead = css`
  margin: 0;
  color: var(--muted);
`;

export const section = css`
  margin-top: 40px;
`;

export const heading = css`
  margin: 0 0 12px;
  font-size: 1.1rem;
`;

export const eventList = css`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const eventCard = css`
  display: grid;
  gap: 2px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  text-decoration: none;

  &:hover {
    border-color: var(--accent);
  }
`;

export const eventName = css`
  font-weight: 700;
`;

export const eventDates = css`
  color: var(--muted);
  font-size: 0.9rem;
`;

export const empty = css`
  margin: 0;
  color: var(--muted);
`;

export const steps = css`
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
`;

export const step = css`
  position: relative;
  padding: 12px 16px 12px 52px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  counter-increment: step;

  &::before {
    content: counter(step);
    position: absolute;
    top: 12px;
    left: 16px;
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--accent);
    color: var(--accent-ink);
    font-size: 0.8rem;
    font-weight: 700;
  }
`;

export const notes = css`
  margin: 0;
  padding-left: 1.2em;
  color: var(--muted);
  font-size: 0.9rem;
`;

export const footer = css`
  padding: 20px 0 32px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.8rem;
`;

export const footerInner = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
`;

/** イベントページ。見出しまでの余白を TOP より詰める（スマホで枠が早く見えるように）。wrap のあとに組み合わせる */
// 広い画面では、ステージを列にした横並び表示が入る幅にする（ブラウザ側の WIDE_QUERY と合わせる）
export const eventMain = css`
  padding-block: 20px 56px;

  @media (min-width: 720px) {
    max-width: 1200px;
  }
`;

export const backLink = css`
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 0.85rem;
`;

export const eventAbout = css`
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.85rem;

  & p {
    margin: 0 0 8px;
  }
`;
