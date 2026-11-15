/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import type { Notice } from "../ui.ts";

/** 保存できなかったときなどの知らせ */
const warning = css`
  margin: 0 0 12px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--surface);
  font-size: 0.9rem;
`;

/** 閉じられる知らせ。右に閉じるボタンの余白を取る */
const noticeBar = css`
  position: relative;
  padding-right: 44px;
`;

/** 注意の知らせ（外れた枠がある、読み込めなかった） */
const noticeWarn = css`
  border-color: var(--warn);
`;

const noticeClose = css`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 36px;
  height: 36px;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
`;

/** 閉じられる知らせ（外れた枠がある、読み込んだ、読み込めなかった） */
export const NoticeBar: FC<{ notice: Notice; onClose: () => void }> = ({ notice, onClose }) => (
  <p class={cx(warning, noticeBar, notice.warn && noticeWarn)} role="status">
    {notice.text}
    <button type="button" class={noticeClose} aria-label="閉じる" onClick={onClose}>
      ×
    </button>
  </p>
);

/** 選択を保存できなかったときの知らせ */
export const SaveFailedNote: FC = () => (
  <p class={warning} role="status">
    このブラウザでは選択を保存できませんでした（プライベートブラウズなど）。ページを閉じると選択は消えます。マイテーブルの「ファイルに書き出す」で控えを取れます。
  </p>
);
