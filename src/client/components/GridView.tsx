/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import {
  closedBox,
  gridBox,
  gridHeight,
  gridOffset,
  gridRange,
  gridTicks,
  PX_PER_MINUTE,
  relayRowsByStage,
  rowsByStage,
  TICK_MINUTES,
} from "../../core/timetable/grid.ts";
import type { ListRow } from "../../core/timetable/list.ts";
import { stageColor } from "../../core/timetable/stage-color.ts";
import { formatMinutes, toMinutes } from "../../core/timetable/time.ts";
import { isRunning, NAME_SEPARATOR, timeLabel, unitTitle, type Unit } from "../../core/timetable/unit.ts";
import type { Day, EventDoc } from "../../shared/event.ts";
import { Check, Live, Order, OverlapFlags, Tags } from "./marks.tsx";
import { type CardContext, pressed, stageStyle } from "../ui.ts";
import {
  card,
  cardButton,
  cardOn,
  cardLive,
  cardHead,
  cardTime,
  cardTitle,
  cardSub,
  talk,
  talkTitle,
} from "./card-styles.ts";
import * as s from "../styles.ts";

/** 時刻の列と、ステージの列。見出しと本体で同じ列の割り方にする */
const gridColumns = `
  display: grid;
  grid-template-columns: var(--axis) repeat(var(--cols), minmax(0, 1fr));
  column-gap: var(--gap);
`;

/** --cols（列の数）・--h（全体の高さ）・--tick（目盛り1つ分の高さ）は、要素の style で渡す */
const grid = css`
  --axis: 56px;
  --gap: 8px;
  margin-top: 8px;
`;

/** ステージの見出し。スクロールしても上に固定する */
const gridHead = css`
  ${gridColumns}
  position: sticky;
  top: 0;
  z-index: 4;
  padding: 8px 0;
  background: var(--bg);
`;

const gridStage = css`
  padding: 4px 8px;
  overflow: hidden;
  border-bottom: 3px solid var(--stage);
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

/** 目盛りの線は、背景の繰り返しで引く */
const gridBody = css`
  ${gridColumns}
  position: relative;
  height: var(--h);
  margin-bottom: 24px;
  background-image: repeating-linear-gradient(to bottom, var(--line) 0 1px, transparent 1px var(--tick));
`;

const gridCol = css`
  position: relative;
`;

const gridTime = css`
  position: absolute;
  left: 0;
  padding-right: 4px;
  transform: translateY(-50%);
  background: var(--bg);
  color: var(--muted);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
`;

/** 正時は強調する */
const gridTimeHour = css`
  color: var(--ink);
  font-weight: 700;
`;

/** 枠の置き場所。位置と高さは要素の style で渡す */
const gridSlot = css`
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
`;

/** ステージ別の休憩など、選べないもの */
const gridMarker = css`
  z-index: 0;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: color-mix(in oklch, var(--muted) 8%, transparent);
  color: var(--muted);
  font-size: 0.8rem;
  text-align: center;
`;

/** ステージが閉まっている時間帯。斜線で塗りつぶす */
const gridClosed = css`
  z-index: 0;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: repeating-linear-gradient(
    -45deg,
    color-mix(in oklch, var(--muted) 18%, transparent) 0 6px,
    transparent 6px 12px
  );
  color: var(--muted);
  font-size: 0.8rem;
`;

/** 中継先のステージの列に出す枠。元の枠と区別できるよう、破線にして地の色を抜く */
const relay = css`
  border-style: dashed;
  border-left-style: dashed;
  background: var(--bg);
`;

const relayBadge = css`
  padding: 0 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  font-size: 0.7rem;
`;

/** 列をまたぐものを置く層。時刻の列を除いた幅にする */
const gridLayer = css`
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--axis) + var(--gap));
  right: 0;
  pointer-events: none;
`;

/** 現在時刻の線。枠より手前に出す */
const gridNow = css`
  position: absolute;
  left: 0;
  right: 0;
  z-index: 3;
  height: 2px;
  margin-top: -1px;
  background: var(--accent);
`;

const gridNowLabel = css`
  position: absolute;
  top: -10px;
  right: 0;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.7rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

/** 全ステージ共通の開場・休憩などの帯 */
const gridBand = css`
  position: absolute;
  left: 0;
  right: 0;
  padding: 2px 8px;
  overflow: hidden;
  border-top: 1px dashed var(--muted);
  background: color-mix(in oklch, var(--muted) 12%, transparent);
  color: var(--muted);
  font-size: 0.75rem;
`;

/** 終了のないものは線だけにする。文字は線の下にはみ出して出す */
const gridBandLine = css`
  overflow: visible;
  background: none;
`;

/** 横並び表示の枠。高さいっぱいに広げ、収まらない分は隠す */
const gridCard = css`
  flex: 1;
  align-content: start;
  gap: 0;
  min-height: 0;
  padding: 6px 34px 6px 10px;
  overflow: hidden;
`;

const gridCardTitle = css`
  display: -webkit-box;
  overflow: hidden;
  font-size: 0.95rem;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
`;

const oneLine = css`
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

/** 横並び表示のブロック。トークが収まらないときは中でスクロールする */
const gridBlock = css`
  flex: 1;
  align-content: start;
  gap: 2px;
  min-height: 0;
  padding: 4px 6px;
  overflow-y: auto;
`;

const gridTalk = css`
  padding: 2px 28px 2px 8px;
  font-size: 0.85rem;
`;

/** 位置と高さを style の文字列にする */
const boxStyle = (box: { top: number; height: number }) => `top:${box.top}px;height:${box.height}px`;

export const GridView: FC<{ doc: EventDoc; day: Day; stageId: string | null; ctx: CardContext }> = ({
  doc,
  day,
  stageId,
  ctx,
}) => {
  const range = gridRange(day);
  if (!range) return <p class={s.empty}>この日の枠はまだありません。</p>;

  const rows = rowsByStage(day);
  const relayRows = relayRowsByStage(day);
  const columns = day.stages
    .map((stage, index) => ({ stage, index, color: stageColor(stage, index) }))
    .filter(({ stage }) => stageId === null || stage.id === stageId);
  const dayEvents = day.day_events ?? [];
  const vars = `--cols:${columns.length};--h:${gridHeight(range)}px;--tick:${TICK_MINUTES * PX_PER_MINUTE}px`;

  return (
    <div class={grid} style={vars}>
      <div class={gridHead}>
        <span />
        {columns.map(({ stage, color }) => (
          <span class={gridStage} style={stageStyle(color)}>
            {stage.name}
          </span>
        ))}
      </div>
      <div class={gridBody}>
        <div class={gridCol}>
          {gridTicks(range).map((tick) => (
            <span class={cx(gridTime, tick % 60 === 0 && gridTimeHour)} style={`top:${gridOffset(range, tick)}px`}>
              {formatMinutes(tick)}
            </span>
          ))}
        </div>

        {/* 全ステージ共通の開場・休憩などは、列をまたぐ帯にする */}
        <div class={gridLayer}>
          {ctx.nowMinutes !== null && range.from <= ctx.nowMinutes && ctx.nowMinutes <= range.to ? (
            <div class={gridNow} data-now="true" style={`top:${gridOffset(range, ctx.nowMinutes)}px`}>
              <span class={gridNowLabel}>{formatMinutes(ctx.nowMinutes)}</span>
            </div>
          ) : null}
          {dayEvents
            .filter((dayEvent) => !dayEvent.stages?.length)
            .map((dayEvent) => {
              const start = toMinutes(dayEvent.start);
              const end = dayEvent.end ? toMinutes(dayEvent.end) : start;
              const height = Math.max((end - start) * PX_PER_MINUTE, 2);
              return (
                <div
                  class={cx(gridBand, end === start && gridBandLine)}
                  style={`top:${gridOffset(range, start)}px;height:${height}px`}
                >
                  {dayEvent.title}
                  {dayEvent.end ? ` 〜${dayEvent.end}` : ""}
                </div>
              );
            })}
        </div>

        {columns.map(({ stage, index, color }) => (
          <div class={gridCol} style={stageStyle(color)}>
            {/* ステージ別の休憩などは、そのステージの列の中に出す。終了がなければ目盛り1つ分の高さにする */}
            {dayEvents
              .filter((dayEvent) => dayEvent.stages?.includes(stage.id))
              .map((dayEvent) => {
                const start = toMinutes(dayEvent.start);
                const end = dayEvent.end ? toMinutes(dayEvent.end) : start + TICK_MINUTES;
                return (
                  <div class={cx(gridSlot, gridMarker)} style={boxStyle(gridBox(range, start, end))}>
                    {dayEvent.title}
                  </div>
                );
              })}
            {/* ステージが閉まっている時間帯は、塗りつぶして枠がないことを示す */}
            {(stage.closed ?? []).map((closed) => {
              const box = closedBox(range, toMinutes(closed.start), toMinutes(closed.end));
              return box ? (
                <div class={cx(gridSlot, gridClosed)} style={boxStyle(box)}>
                  クローズ
                </div>
              ) : null;
            })}
            {rows[index].map((row) => {
              const first = row.units[0];
              return (
                <div class={gridSlot} style={boxStyle(gridBox(range, first.start, first.end))}>
                  {row.slot.items ? <GridBlock row={row} ctx={ctx} /> : <GridCard doc={doc} unit={first} ctx={ctx} />}
                </div>
              );
            })}
            {/* 同時中継で映される枠は、中継先のステージの列にも出す。選ぶと元の枠が選ばれる */}
            {relayRows[index].map((row) => {
              const first = row.units[0];
              const relayFrom = first.stage.name;
              return (
                <div class={gridSlot} style={boxStyle(gridBox(range, first.start, first.end))}>
                  {row.slot.items ? (
                    <GridBlock row={row} ctx={ctx} relayFrom={relayFrom} />
                  ) : (
                    <GridCard doc={doc} unit={first} ctx={ctx} relayFrom={relayFrom} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/** 横並び表示の枠。高さは枠の時間で決まるので、収まらない分は隠す（全文は title で読める） */
const GridCard: FC<{
  doc: EventDoc;
  unit: Unit;
  ctx: CardContext;
  /** 中継先のステージの列に出すときの、元のステージ名 */
  relayFrom?: string;
}> = ({ doc, unit, ctx, relayFrom }) => {
  const { slot } = unit;
  const on = ctx.selected.has(unit.id);
  const running = isRunning(unit, ctx.nowMinutes);
  const title = unitTitle(unit);
  const sub = [slot.subtitle, slot.note, slot.speakers?.join(NAME_SEPARATOR)].filter(Boolean);
  return (
    <button
      type="button"
      class={cx(card, cardButton, gridCard, relayFrom && relay, on && cardOn, running && cardLive)}
      aria-pressed={pressed(on)}
      title={title}
      onClick={() => ctx.toggle(unit.id)}
    >
      <span class={cardHead}>
        <span class={cardTime}>{timeLabel(unit)}</span>
        {running ? <Live /> : null}
        {relayFrom ? <span class={relayBadge}>中継 {relayFrom}</span> : null}
        {slot.kind_label ? <span class={s.muted}>{slot.kind_label}</span> : null}
      </span>
      <span class={cx(cardTitle, gridCardTitle)}>{title}</span>
      {sub.length > 0 ? <span class={cx(cardSub, oneLine)}>{sub.join(" · ")}</span> : null}
      <Tags doc={doc} tags={slot.tags} />
      <OverlapFlags overlaps={ctx.overlaps.get(unit.id)} />
      <Check on={on} size="small" />
    </button>
  );
};

/** 横並び表示のブロック。トーク1本ずつを1行で出し、収まらないときは中でスクロールする */
const GridBlock: FC<{ row: ListRow; ctx: CardContext; relayFrom?: string }> = ({ row, ctx, relayFrom }) => {
  const { slot, units } = row;
  const heading = [timeLabel(units[0]), slot.title, slot.kind_label].filter(Boolean).join(" · ");
  const running = isRunning(units[0], ctx.nowMinutes);
  return (
    <div class={cx(card, gridBlock, relayFrom && relay, running && cardLive)}>
      <span class={cx(cardHead, s.muted)}>
        {heading}
        {running ? <Live /> : null}
        {relayFrom ? <span class={relayBadge}>中継 {relayFrom}</span> : null}
      </span>
      {units.map((unit) => {
        const on = ctx.selected.has(unit.id);
        const title = unitTitle(unit);
        return (
          <button
            type="button"
            class={cx(talk, gridTalk, on && cardOn)}
            aria-pressed={pressed(on)}
            title={title}
            onClick={() => ctx.toggle(unit.id)}
          >
            <span class={cx(talkTitle, oneLine)}>
              <Order unit={unit} />
              {title}
            </span>
            <Check on={on} size="mini" />
          </button>
        );
      })}
    </div>
  );
};
