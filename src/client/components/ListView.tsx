/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { css } from "hono/jsx/dom/css";
import type { ListGroup } from "../../domain/list.ts";
import { formatMinutes } from "../../domain/time.ts";
import { NAME_SEPARATOR } from "../../domain/unit.ts";
import type { Day, DayEvent, EventDoc } from "../../shared/event.ts";
import { BlockCard } from "./BlockCard.tsx";
import { UnitCard } from "./UnitCard.tsx";
import type { CardContext } from "../ui.ts";
import * as s from "../styles.ts";

/** scroll-margin-top は、「いまへ」で移動したときに、上に固定した表示の切り替えに隠れないための余白 */
const timeGroup = css`
  display: grid;
  gap: 8px;
  padding: 12px 0;
  scroll-margin-top: 64px;
`;

const groupTime = css`
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
`;

const dayEventRow = css`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin: 0;
  padding: 8px 12px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  font-size: 0.85rem;
`;

/** 「いまへ」の行き先にする、時刻のまとまりの開始時刻。いま以前で最後に始まったまとまり（なければ最初のまとまり） */
function nowGroupStart(groups: ListGroup[], nowMinutes: number | null): number | null {
  if (nowMinutes === null) return null;
  const started = groups.filter((group) => group.start <= nowMinutes);
  return (started.at(-1) ?? groups[0])?.start ?? null;
}

export const ListView: FC<{ doc: EventDoc; day: Day; groups: ListGroup[]; ctx: CardContext }> = ({
  doc,
  day,
  groups,
  ctx,
}) =>
  groups.length > 0 ? (
    <div>
      {groups.map((group) => (
        <section
          class={timeGroup}
          data-now={group.start === nowGroupStart(groups, ctx.nowMinutes) ? "true" : undefined}
        >
          <h2 class={groupTime}>{formatMinutes(group.start)}</h2>
          {group.dayEvents.map((dayEvent) => (
            <DayEventRow day={day} dayEvent={dayEvent} />
          ))}
          {group.rows.map((row) =>
            row.slot.items ? (
              <BlockCard doc={doc} row={row} ctx={ctx} />
            ) : (
              row.units.map((unit) => <UnitCard doc={doc} unit={unit} ctx={ctx} />)
            ),
          )}
        </section>
      ))}
    </div>
  ) : (
    <p class={s.empty}>この日の枠はまだありません。</p>
  );

/** 開場・休憩など */
const DayEventRow: FC<{ day: Day; dayEvent: DayEvent }> = ({ day, dayEvent }) => {
  const where = dayEvent.stages?.length
    ? dayEvent.stages.map((id) => day.stages.find((stage) => stage.id === id)?.name ?? id).join(NAME_SEPARATOR)
    : "全体";
  return (
    <p class={dayEventRow}>
      <span>{dayEvent.title}</span>
      <span class={s.muted}>
        {where}
        {dayEvent.end ? ` · 〜${dayEvent.end}` : ""}
      </span>
    </p>
  );
};
