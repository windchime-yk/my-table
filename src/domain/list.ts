// リスト表示の組み立て。1日分を開始時刻ごとにまとめ、開場・休憩などの day_events も同じ時刻の位置に入れる

import type { Day, DayEvent, Slot } from "../shared/event.ts";
import { toMinutes } from "./time.ts";
import { unitsForDay, type Unit } from "./unit.ts";

/** リストの1行。ブロックの枠は、中のトークをまとめて1行にする */
export interface ListRow {
  slot: Slot;
  units: Unit[];
}

/** 同じ開始時刻のまとまり */
export interface ListGroup {
  /** 開始（その日の 0:00 からの分） */
  start: number;
  dayEvents: DayEvent[];
  rows: ListRow[];
}

/**
 * 1日分を開始時刻順のまとまりにする。
 * stageId を渡すとそのステージだけに絞る（同時中継先のステージで絞ったときは、中継される枠も入る）。
 * 全ステージ共通の day_events は絞り込んでも残す
 */
export function listGroups(day: Day, stageId: string | null): ListGroup[] {
  const groups = new Map<number, ListGroup>();
  const groupAt = (start: number): ListGroup => {
    const found = groups.get(start);
    if (found) return found;
    const created: ListGroup = { start, dayEvents: [], rows: [] };
    groups.set(start, created);
    return created;
  };

  for (const unit of unitsForDay(day)) {
    // 同時中継の枠は、中継先のステージで絞り込んだときにも出す
    const onStage = unit.stage.id === stageId || unit.relayStages.some((stage) => stage.id === stageId);
    if (stageId !== null && !onStage) continue;
    const { rows } = groupAt(unit.start);
    const row = rows.find((r) => r.slot === unit.slot);
    if (row) row.units.push(unit);
    else rows.push({ slot: unit.slot, units: [unit] });
  }

  for (const dayEvent of day.day_events ?? []) {
    if (stageId !== null && dayEvent.stages && !dayEvent.stages.includes(stageId)) continue;
    groupAt(toMinutes(dayEvent.start)).dayEvents.push(dayEvent);
  }

  return [...groups.values()].toSorted((a, b) => a.start - b.start);
}
