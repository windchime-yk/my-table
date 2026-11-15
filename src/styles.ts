// サーバー側の、複数のページで使うスタイル（hono/css）とテーマ。
// 1つのページ・部品でしか使わないスタイルは、そのファイルに置く

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

export const empty = css`
  margin: 0;
  color: var(--muted);
`;
