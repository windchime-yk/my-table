/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import { pressed, type View } from "../ui.ts";

/** スクロールしても切り替えられるよう、上に固定する */
const views = css`
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

const viewsStatic = css`
  position: static;
`;

const tab = css`
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

const tabOn = css`
  border-color: var(--ink);
  background: var(--ink);
  color: var(--bg);
`;

/** マイテーブルの件数 */
const count = css`
  display: inline-block;
  min-width: 1.6em;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.8rem;
`;

/** 表示の切り替え（タイムテーブル / マイテーブル） */
export const ViewTabs: FC<{
  view: View;
  /** 表示している日の、選んだ件数 */
  mineCount: number;
  /** 上に固定するか。横並び表示ではステージの見出しを上に固定するので、こちらは固定しない */
  pinned: boolean;
  onChange: (view: View) => void;
}> = ({ view, mineCount, pinned, onChange }) => (
  <nav class={cx(views, !pinned && viewsStatic)} aria-label="表示">
    <button
      type="button"
      class={cx(tab, view === "all" && tabOn)}
      aria-pressed={pressed(view === "all")}
      onClick={() => onChange("all")}
    >
      タイムテーブル
    </button>
    <button
      type="button"
      class={cx(tab, view === "mine" && tabOn)}
      aria-pressed={pressed(view === "mine")}
      onClick={() => onChange("mine")}
    >
      マイテーブル <span class={count}>{mineCount}</span>
    </button>
  </nav>
);
