/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import type { Unit } from "../../core/timetable/unit.ts";
import type { EventDoc } from "../../shared/event.ts";
import { UnitCard } from "./UnitCard.tsx";
import type { CardContext } from "../ui.ts";
import * as s from "../styles.ts";

/** 広い画面でも読みやすい幅に収め、中央に寄せる */
const mineColumn = css`
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
`;

/** 取り消しにくい操作は、目立たせない */
const actionGhost = css`
  background: none;
  color: var(--muted);
`;

const stack = css`
  display: grid;
  gap: 8px;
  padding: 12px 0;
`;

const emptyBox = css`
  margin: 0;
  padding: 32px 16px;
  border: 1px dashed var(--line);
  border-radius: 12px;
  color: var(--muted);
  text-align: center;
`;

const note = css`
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.8rem;
`;

export const MineView: FC<{
  doc: EventDoc;
  /** 表示している日の、選んだ単位 */
  units: Unit[];
  ctx: CardContext;
  /** ほかの日も含めて、何か選んでいるか */
  hasAnySelection: boolean;
  onImage: () => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
}> = ({ doc, units, ctx, hasAnySelection, onImage, onExport, onImport, onClear }) => (
  <div class={cx(stack, mineColumn)}>
    <div class={s.actions}>
      {units.length > 0 ? (
        <button type="button" class={cx(s.action, s.actionPrimary)} onClick={onImage}>
          画像で保存
        </button>
      ) : null}
      <button type="button" class={s.action} onClick={onExport}>
        ファイルに書き出す
      </button>
      <button type="button" class={s.action} onClick={onImport}>
        ファイルから読み込む
      </button>
      {hasAnySelection ? (
        <button type="button" class={cx(s.action, actionGhost)} onClick={onClear}>
          すべて解除
        </button>
      ) : null}
    </div>
    {units.length > 0 ? (
      units.map((unit) => <UnitCard doc={doc} unit={unit} ctx={ctx} />)
    ) : (
      <p class={emptyBox}>まだ何も選んでいません。「タイムテーブル」で見たい枠をタップしてください。</p>
    )}
    <p class={note}>
      選んだ枠はこのブラウザにだけ保存され、サーバーには送信しません。控えを取るときや、別の端末・ブラウザに移すときは、ファイルに書き出して読み込んでください。当日は電波が弱いこともあるので、表示している日の分を画像で保存しておくと安心です。
    </p>
  </div>
);
