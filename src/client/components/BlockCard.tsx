/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import type { ListRow } from "../../core/timetable/list.ts";
import { stageColor } from "../../core/timetable/stage-color.ts";
import { isRunning, NAME_SEPARATOR, timeLabel, unitTitle } from "../../core/timetable/unit.ts";
import type { EventDoc } from "../../shared/event.ts";
import { Check, Live, Order, OverlapFlags, Relay, Tags } from "./marks.tsx";
import { type CardContext, pressed, stageStyle } from "../ui.ts";
import { card, cardOn, cardLive, cardHead, cardTime, cardStage, cardSub, talk, talkTitle } from "./card-styles.ts";
import * as s from "../styles.ts";

const block = css`
  gap: 6px;
`;

const blockNote = css`
  color: var(--muted);
  font-size: 0.8rem;
`;

/** ブロック。1つの枠に、個別の開始時刻なしで複数のトークが入っている。トーク1本ずつを選ぶ */
export const BlockCard: FC<{ doc: EventDoc; row: ListRow; ctx: CardContext }> = ({ doc, row, ctx }) => {
  const { slot, units } = row;
  const first = units[0];
  // ブロックの中のトークには個別の時刻がないので、進行中かは枠の時間で判定する
  const running = isRunning(first, ctx.nowMinutes);
  const heading = [slot.title, slot.kind_label].filter(Boolean).join(" · ");
  return (
    <div class={cx(card, block, running && cardLive)} style={stageStyle(stageColor(first.stage, first.stageIndex))}>
      <span class={cardHead}>
        <span class={cardTime}>{timeLabel(first)}</span>
        {running ? <Live /> : null}
        <span class={cardStage}>{first.stage.name}</span>
        {heading ? <span class={s.muted}>{heading}</span> : null}
      </span>
      <span class={blockNote}>各トークの開始時刻は公開されていません。順番のみ表示しています。</span>
      {slot.note ? <span class={cardSub}>{slot.note}</span> : null}
      <Tags doc={doc} tags={slot.tags} />
      <Relay unit={first} />
      {units.map((unit) => {
        const on = ctx.selected.has(unit.id);
        return (
          <button
            type="button"
            class={cx(talk, on && cardOn)}
            aria-pressed={pressed(on)}
            onClick={() => ctx.toggle(unit.id)}
          >
            <span class={talkTitle}>
              <Order unit={unit} />
              {unitTitle(unit)}
            </span>
            {unit.item?.speakers?.length ? (
              <span class={cardSub}>{unit.item.speakers.join(NAME_SEPARATOR)}</span>
            ) : null}
            <OverlapFlags overlaps={ctx.overlaps.get(unit.id)} />
            <Check on={on} />
          </button>
        );
      })}
    </div>
  );
};
