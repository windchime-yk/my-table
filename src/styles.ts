import { css } from "hono/css";

/** 全体テーマ。色は CSS 変数で定義し、ダーク・ライトを OS の設定に合わせて切り替える */
export const globalClass = css`
  :-hono-global {
    :root {
      --bg: #0d0f12;
      --surface: #171a1f;
      --ink: #f2f4f7;
      --muted: #9aa3ad;
      --line: #2a2f36;
      --accent: #9be22d;
      --accent-ink: #0d0f12;
      color-scheme: dark;
    }

    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f6f7f9;
        --surface: #ffffff;
        --ink: #14171a;
        --muted: #5d6670;
        --line: #dde1e6;
        --accent: #4d8a00;
        --accent-ink: #ffffff;
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
