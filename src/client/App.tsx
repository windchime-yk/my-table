/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { useMemo, useState } from "hono/jsx";
import { cx } from "hono/jsx/dom/css";
import { listGroups, type ListGroup, type ListRow } from "../domain/list.ts";
import { toggleSelected } from "../domain/selection.ts";
import { stageColor } from "../domain/stage-color.ts";
import { formatMinutes } from "../domain/time.ts";
import { timeLabel, unitsForDay, type Unit } from "../domain/unit.ts";
import { shortDate } from "../shared/date.ts";
import type { Day, DayEvent, EventDoc } from "../shared/event.ts";
import { saveSelection } from "./storage.ts";
import * as s from "./styles.ts";

/** all: タイムテーブル / mine: マイテーブル */
type View = "all" | "mine";

/** 枠の選択。選んでいる ID と、選ぶ・外すの切り替え */
interface Selection {
  selected: Set<string>;
  toggle: (id: string) => void;
}

/** ステージの色を、子孫の要素が使う CSS 変数として渡す */
const stageStyle = (color: string) => `--stage:${color}`;

const pressed = (on: boolean) => (on ? "true" : "false");

export const App: FC<{ doc: EventDoc; initialSelected: string[] }> = ({ doc, initialSelected }) => {
  const [view, setView] = useState<View>("all");
  /** 絞り込むステージの ID。null は「すべて」 */
  const [stageId, setStageId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState(initialSelected);
  const [saveFailed, setSaveFailed] = useState(false);

  // 日付の切り替えを入れるまでは、初日だけを出す
  const day = doc.days[0];
  const groups = useMemo(() => listGroups(day, stageId), [day, stageId]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  /** 表示している日のマイテーブル（時刻順） */
  const mine = useMemo(() => unitsForDay(day).filter((unit) => selected.has(unit.id)), [day, selected]);

  const toggle = (id: string) => {
    const next = toggleSelected(selectedIds, id);
    setSelectedIds(next);
    setSaveFailed(!saveSelection(doc.id, doc.version, next));
  };
  const selection: Selection = { selected, toggle };

  const switchView = (next: View) => {
    setView(next);
    // 長いタイムテーブルの途中で切り替えても、切り替え先を先頭から見られるようにする
    window.scrollTo({ top: 0 });
  };

  return (
    <>
      <p class={s.dayLine}>{[day.label, shortDate(day.date)].filter(Boolean).join(" · ")}</p>

      <nav class={s.views} aria-label="表示">
        <button
          type="button"
          class={cx(s.tab, view === "all" && s.tabOn)}
          aria-pressed={pressed(view === "all")}
          onClick={() => switchView("all")}
        >
          タイムテーブル
        </button>
        <button
          type="button"
          class={cx(s.tab, view === "mine" && s.tabOn)}
          aria-pressed={pressed(view === "mine")}
          onClick={() => switchView("mine")}
        >
          マイテーブル <span class={s.count}>{mine.length}</span>
        </button>
      </nav>

      {saveFailed ? (
        <p class={s.warning} role="status">
          このブラウザでは選択を保存できませんでした（プライベートブラウズなど）。ページを閉じると選択は消えます。
        </p>
      ) : null}

      {view === "mine" ? (
        <MineView doc={doc} units={mine} selection={selection} />
      ) : (
        <>
          <StageChips day={day} stageId={stageId} onChange={setStageId} />
          <ListView doc={doc} day={day} groups={groups} selection={selection} />
        </>
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
      aria-pressed={pressed(stageId === null)}
      onClick={() => onChange(null)}
    >
      すべて
    </button>
    {day.stages.map((stage, i) => (
      <button
        type="button"
        class={cx(s.chip, stageId === stage.id && s.chipOn)}
        aria-pressed={pressed(stageId === stage.id)}
        style={stageStyle(stageColor(stage, i))}
        onClick={() => onChange(stage.id)}
      >
        {stage.name}
      </button>
    ))}
  </div>
);

// ---------- タイムテーブル（リスト） ----------

const ListView: FC<{ doc: EventDoc; day: Day; groups: ListGroup[]; selection: Selection }> = ({
  doc,
  day,
  groups,
  selection,
}) =>
  groups.length > 0 ? (
    <div>
      {groups.map((group) => (
        <section class={s.group}>
          <h2 class={s.groupTime}>{formatMinutes(group.start)}</h2>
          {group.dayEvents.map((dayEvent) => (
            <DayEventRow day={day} dayEvent={dayEvent} />
          ))}
          {group.rows.map((row) =>
            row.slot.items ? (
              <BlockCard doc={doc} row={row} selection={selection} />
            ) : (
              row.units.map((unit) => <UnitCard doc={doc} unit={unit} selection={selection} />)
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

// ---------- 選べる単位 ----------

/** タグの表示名を並べる。定義がないキーはそのまま出す */
const Tags: FC<{ doc: EventDoc; tags: string[] | undefined }> = ({ doc, tags }) =>
  tags && tags.length > 0 ? (
    <span class={s.flags}>
      {tags.map((tag) => (
        <span class={s.flag}>{doc.tag_definitions?.[tag] ?? tag}</span>
      ))}
    </span>
  ) : null;

/** 選んでいるかの印 */
const Check: FC<{ on: boolean }> = ({ on }) => (
  <span class={cx(s.check, on && s.checkOn)} aria-hidden="true">
    {on ? "✓" : "+"}
  </span>
);

/**
 * 選べる単位1つのカード。タップで選ぶ・外す。
 * ブロックの中のトークも、マイテーブルではこのカードで出す（何本目かを添える）
 */
const UnitCard: FC<{ doc: EventDoc; unit: Unit; selection: Selection }> = ({ doc, unit, selection }) => {
  const { slot, item, order } = unit;
  const on = selection.selected.has(unit.id);
  const kind = [slot.kind_label, order ? `${order.index}/${order.total}本目` : null].filter(Boolean).join(" · ");
  const speakers = item ? item.speakers : slot.speakers;
  const sub = [item ? null : slot.subtitle, slot.note, speakers?.join("・")].filter(Boolean);
  return (
    <button
      type="button"
      class={cx(s.card, s.cardButton, on && s.cardOn)}
      aria-pressed={pressed(on)}
      style={stageStyle(stageColor(unit.stage, unit.stageIndex))}
      onClick={() => selection.toggle(unit.id)}
    >
      <span class={s.cardHead}>
        <span class={s.cardTime}>{timeLabel(unit)}</span>
        <span class={s.cardStage}>{unit.stage.name}</span>
        {kind ? <span class={s.muted}>{kind}</span> : null}
      </span>
      <span class={s.cardTitle}>{item ? item.title : (slot.title ?? slot.kind_label ?? "")}</span>
      {sub.length > 0 ? <span class={s.cardSub}>{sub.join(" · ")}</span> : null}
      <Tags doc={doc} tags={slot.tags} />
      <Check on={on} />
    </button>
  );
};

/** ブロック。1つの枠に、個別の開始時刻なしで複数のトークが入っている。トーク1本ずつを選ぶ */
const BlockCard: FC<{ doc: EventDoc; row: ListRow; selection: Selection }> = ({ doc, row, selection }) => {
  const { slot, units } = row;
  const first = units[0];
  const heading = [slot.title, slot.kind_label].filter(Boolean).join(" · ");
  return (
    <div class={cx(s.card, s.block)} style={stageStyle(stageColor(first.stage, first.stageIndex))}>
      <span class={s.cardHead}>
        <span class={s.cardTime}>{timeLabel(first)}</span>
        <span class={s.cardStage}>{first.stage.name}</span>
        {heading ? <span class={s.muted}>{heading}</span> : null}
      </span>
      <span class={s.blockNote}>各トークの開始時刻は公開されていません。順番のみ表示しています。</span>
      {slot.note ? <span class={s.cardSub}>{slot.note}</span> : null}
      <Tags doc={doc} tags={slot.tags} />
      {units.map((unit) => {
        const on = selection.selected.has(unit.id);
        return (
          <button
            type="button"
            class={cx(s.talk, on && s.cardOn)}
            aria-pressed={pressed(on)}
            onClick={() => selection.toggle(unit.id)}
          >
            <span class={s.talkTitle}>{unit.item?.title ?? ""}</span>
            {unit.item?.speakers?.length ? <span class={s.cardSub}>{unit.item.speakers.join("・")}</span> : null}
            <Check on={on} />
          </button>
        );
      })}
    </div>
  );
};

// ---------- マイテーブル ----------

const MineView: FC<{ doc: EventDoc; units: Unit[]; selection: Selection }> = ({ doc, units, selection }) => (
  <div class={s.stack}>
    {units.length > 0 ? (
      units.map((unit) => <UnitCard doc={doc} unit={unit} selection={selection} />)
    ) : (
      <p class={s.emptyBox}>まだ何も選んでいません。「タイムテーブル」で見たい枠をタップしてください。</p>
    )}
    <p class={s.note}>選んだ枠はこのブラウザにだけ保存され、サーバーには送信しません。</p>
  </div>
);
