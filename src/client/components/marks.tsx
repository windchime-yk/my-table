/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import type { Overlap } from "../../domain/overlap.ts";
import { NAME_SEPARATOR, unitTitle, type Unit } from "../../domain/unit.ts";
import type { EventDoc } from "../../shared/event.ts";

/** 進行中の印 */
const live = css`
  padding: 0 8px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.7rem;
  font-weight: 700;
`;

const flags = css`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
`;

const flag = css`
  padding: 1px 8px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.75rem;
`;

/** 時間の重なりなどの注意 */
const flagWarn = css`
  border-color: var(--warn);
  color: var(--warn);
`;

const check = css`
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

const checkOn = css`
  border-color: var(--stage, var(--accent));
  background: var(--stage, var(--accent));
  color: var(--bg);
`;

/** ブロックの中での順番（「1/3」） */
const talkOrder = css`
  margin-right: 6px;
  color: var(--muted);
  font-size: 0.8em;
  font-weight: 400;
  font-variant-numeric: tabular-nums;
`;

const checkSmall = css`
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  margin-top: 0;
  font-size: 0.8rem;
`;

const checkMini = css`
  right: 4px;
  width: 20px;
  height: 20px;
  margin-top: -10px;
  font-size: 0.7rem;
`;

/** タグの表示名を並べる。定義がないキーはそのまま出す */
export const Tags: FC<{ doc: EventDoc; tags: string[] | undefined }> = ({ doc, tags }) =>
  tags && tags.length > 0 ? (
    <span class={flags}>
      {tags.map((tag) => (
        <span class={flag}>{doc.tag_definitions?.[tag] ?? tag}</span>
      ))}
    </span>
  ) : null;

/**
 * 時間の重なりの知らせ。重なる単位も選べるままにし、相手が分かるよう名前を添える。
 * 確実な重なりと、推定の終了時刻による「可能性あり」は分けて出す
 */
export const OverlapFlags: FC<{ overlaps: Overlap[] | undefined }> = ({ overlaps }) => {
  if (!overlaps || overlaps.length === 0) return null;
  const names = (certain: boolean) =>
    overlaps
      .filter((overlap) => overlap.certain === certain)
      .map((overlap) => unitTitle(overlap.other))
      .join("、");
  const certain = names(true);
  const possible = names(false);
  return (
    <span class={flags}>
      {certain ? <span class={cx(flag, flagWarn)}>時間が重なっています: {certain}</span> : null}
      {possible ? <span class={cx(flag, flagWarn)}>重なっている可能性があります: {possible}</span> : null}
    </span>
  );
};

/** 同時中継先のステージ。中継があるときだけ出す */
export const Relay: FC<{ unit: Unit }> = ({ unit }) =>
  unit.relayStages.length > 0 ? (
    <span class={flags}>
      <span class={flag}>同時中継: {unit.relayStages.map((stage) => stage.name).join(NAME_SEPARATOR)}</span>
    </span>
  ) : null;

/** ブロックの中での順番（「1/3」）。何本目かが分かるようにする */
export const Order: FC<{ unit: Unit }> = ({ unit }) =>
  unit.order ? (
    <span class={talkOrder}>
      {unit.order.index}/{unit.order.total}
    </span>
  ) : null;

/** 進行中の印 */
export const Live: FC = () => <span class={live}>進行中</span>;

/** 選んでいるかの印。横並び表示では小さくする */
export const Check: FC<{ on: boolean; size?: "small" | "mini" }> = ({ on, size }) => (
  <span
    class={cx(check, size === "small" && checkSmall, size === "mini" && checkMini, on && checkOn)}
    aria-hidden="true"
  >
    {on ? "✓" : "+"}
  </span>
);
