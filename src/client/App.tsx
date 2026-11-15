/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { useMemo, useState } from "hono/jsx";
import { cx } from "hono/jsx/dom/css";
import { listGroups, type ListRow } from "../domain/list.ts";
import { stageColor } from "../domain/stage-color.ts";
import { formatMinutes } from "../domain/time.ts";
import { timeLabel, type Unit } from "../domain/unit.ts";
import { shortDate } from "../shared/date.ts";
import type { Day, DayEvent, EventDoc } from "../shared/event.ts";
import * as s from "./styles.ts";

/** ステージの色を、子孫の要素が使う CSS 変数として渡す */
const stageStyle = (color: string) => `--stage:${color}`;

export const App: FC<{ doc: EventDoc }> = ({ doc }) => {
  /** 絞り込むステージの ID。null は「すべて」 */
  const [stageId, setStageId] = useState<string | null>(null);
  // 日付の切り替えを入れるまでは、初日だけを出す
  const day = doc.days[0];
  const groups = useMemo(() => listGroups(day, stageId), [day, stageId]);

  return (
    <>
      <p class={s.dayLine}>{[day.label, shortDate(day.date)].filter(Boolean).join(" · ")}</p>
      <StageChips day={day} stageId={stageId} onChange={setStageId} />
      {groups.length > 0 ? (
        groups.map((group) => (
          <section class={s.group}>
            <h2 class={s.groupTime}>{formatMinutes(group.start)}</h2>
            {group.dayEvents.map((dayEvent) => (
              <DayEventRow day={day} dayEvent={dayEvent} />
            ))}
            {group.rows.map((row) =>
              row.slot.items ? (
                <BlockCard doc={doc} row={row} />
              ) : (
                row.units.map((unit) => <UnitCard doc={doc} unit={unit} />)
              ),
            )}
          </section>
        ))
      ) : (
        <p class={s.empty}>この日の枠はまだありません。</p>
      )}
    </>
  );
};

// ---------- ステージの絞り込み ----------

const StageChips: FC<{ day: Day; stageId: string | null; onChange: (stageId: string | null) => void }> = ({
  day,
  stageId,
  onChange,
}) => (
  <div class={s.chips} role="group" aria-label="ステージで絞り込む">
    <button
      type="button"
      class={cx(s.chip, stageId === null && s.chipOn)}
      aria-pressed={stageId === null ? "true" : "false"}
      onClick={() => onChange(null)}
    >
      すべて
    </button>
    {day.stages.map((stage, i) => (
      <button
        type="button"
        class={cx(s.chip, stageId === stage.id && s.chipOn)}
        aria-pressed={stageId === stage.id ? "true" : "false"}
        style={stageStyle(stageColor(stage, i))}
        onClick={() => onChange(stage.id)}
      >
        {stage.name}
      </button>
    ))}
  </div>
);

// ---------- 開場・休憩など ----------

const DayEventRow: FC<{ day: Day; dayEvent: DayEvent }> = ({ day, dayEvent }) => {
  const where = dayEvent.stages?.length
    ? dayEvent.stages.map((id) => day.stages.find((stage) => stage.id === id)?.name ?? id).join("・")
    : "全体";
  return (
    <p class={s.dayEvent}>
      <span>{dayEvent.title}</span>
      <span class={s.muted}>
        {where}
        {dayEvent.end ? ` · 〜${dayEvent.end}` : ""}
      </span>
    </p>
  );
};

// ---------- 枠 ----------

/** タグの表示名を並べる。定義がないキーはそのまま出す */
const Tags: FC<{ doc: EventDoc; tags: string[] | undefined }> = ({ doc, tags }) =>
  tags && tags.length > 0 ? (
    <span class={s.flags}>
      {tags.map((tag) => (
        <span class={s.flag}>{doc.tag_definitions?.[tag] ?? tag}</span>
      ))}
    </span>
  ) : null;

/** 枠1つ（ブロックでない枠） */
const UnitCard: FC<{ doc: EventDoc; unit: Unit }> = ({ doc, unit }) => {
  const { slot } = unit;
  const sub = [slot.subtitle, slot.note, slot.speakers?.join("・")].filter(Boolean);
  return (
    <article class={s.card} style={stageStyle(stageColor(unit.stage, unit.stageIndex))}>
      <p class={s.cardHead}>
        <span class={s.cardTime}>{timeLabel(unit)}</span>
        <span class={s.cardStage}>{unit.stage.name}</span>
        {slot.kind_label ? <span class={s.muted}>{slot.kind_label}</span> : null}
      </p>
      <p class={s.cardTitle}>{slot.title ?? slot.kind_label ?? ""}</p>
      {sub.length > 0 ? <p class={s.cardSub}>{sub.join(" · ")}</p> : null}
      <Tags doc={doc} tags={slot.tags} />
    </article>
  );
};

/** ブロック。1つの枠に、個別の開始時刻なしで複数のトークが入っている */
const BlockCard: FC<{ doc: EventDoc; row: ListRow }> = ({ doc, row }) => {
  const { slot, units } = row;
  const first = units[0];
  const heading = [slot.title, slot.kind_label].filter(Boolean).join(" · ");
  return (
    <article class={cx(s.card, s.block)} style={stageStyle(stageColor(first.stage, first.stageIndex))}>
      <p class={s.cardHead}>
        <span class={s.cardTime}>{timeLabel(first)}</span>
        <span class={s.cardStage}>{first.stage.name}</span>
        {heading ? <span class={s.muted}>{heading}</span> : null}
      </p>
      <p class={s.blockNote}>各トークの開始時刻は公開されていません。順番のみ表示しています。</p>
      {slot.note ? <p class={s.cardSub}>{slot.note}</p> : null}
      <ol class={s.talks}>
        {units.map((unit) => (
          <li class={s.talk}>
            <span class={s.cardTitle}>{unit.item?.title ?? ""}</span>
            {unit.item?.speakers?.length ? <span class={s.cardSub}>{unit.item.speakers.join("・")}</span> : null}
          </li>
        ))}
      </ol>
      <Tags doc={doc} tags={slot.tags} />
    </article>
  );
};
