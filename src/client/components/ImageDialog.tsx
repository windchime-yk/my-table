/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { useEffect, useRef } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import type { PreviewImage } from "../ui.ts";
import * as s from "../styles.ts";

const previewDialog = css`
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: var(--surface);
  color: var(--ink);
`;

const dialogText = css`
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
`;

const dialogImage = css`
  display: block;
  width: 100%;
  height: auto;
  margin: 8px 0 12px;
  border-radius: 8px;
`;

/** 作った画像のプレビュー。確かめてから保存できるようにする */
export const ImageDialog: FC<{ image: PreviewImage; onClose: () => void }> = ({ image, onClose }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 画像ができたら（このコンポーネントが出たら）、ダイアログを開く
  useEffect(() => {
    dialogRef.current?.showModal();
  }, [image.url]);

  return (
    <dialog ref={dialogRef} class={previewDialog} onClose={onClose}>
      <p class={dialogText}>スマホでは、画像を長押しすると写真に保存できます。</p>
      <img class={dialogImage} src={image.url} alt="マイテーブルの画像" />
      <div class={s.actions}>
        <a class={cx(s.action, s.actionPrimary)} href={image.url} download={image.filename}>
          ダウンロード
        </a>
        <button type="button" class={s.action} onClick={() => dialogRef.current?.close()}>
          閉じる
        </button>
      </div>
    </dialog>
  );
};
