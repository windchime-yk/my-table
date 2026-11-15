// 横並び表示（ステージを列、時間を縦軸にした表示）の位置の計算

import type { Day } from "../../shared/event.ts";
import type { ListRow } from "./list.ts";
import { toMinutes } from "./time.ts";
import { unitsForDay } from "./unit.ts";

/** 1分あたりの高さ（px）。30分の枠が約100px になる */
export const PX_PER_MINUTE = 3.4;
/** 時刻の目盛りの間隔（分） */
export const TICK_MINUTES = 30;
/** 枠どうしの間を空けるために、高さから引く分（px） */
const SLOT_GAP = 4;
/** 短い枠でもタップできるよう確保する、最低限の高さ（px） */
export const MIN_SLOT_HEIGHT = 24;

/** 縦軸に表示する時間の範囲（その日の 0:00 からの分） */
export interface GridRange {
  from: number;
  to: number;
}

/**
 * 1日分の表示範囲。枠と day_events がすべて入る範囲を、目盛りの間隔（30分）に丸める。
 * ステージで絞り込んでも縦の位置が動かないよう、全ステージから求める。枠も day_events もなければ null
 */
export function gridRange(day: Day): GridRange | null {
  const points = [
    ...day.stages.flatMap((stage) => stage.slots.flatMap((slot) => [toMinutes(slot.start), toMinutes(slot.end)])),
    ...(day.day_events ?? []).flatMap((dayEvent) =>
      dayEvent.end ? [toMinutes(dayEvent.start), toMinutes(dayEvent.end)] : [toMinutes(dayEvent.start)],
    ),
  ];
  if (points.length === 0) return null;
  const from = Math.floor(Math.min(...points) / TICK_MINUTES) * TICK_MINUTES;
  const to = Math.ceil(Math.max(...points) / TICK_MINUTES) * TICK_MINUTES;
  // 終了のない day_events だけの日でも、高さが 0 にならないようにする
  return { from, to: Math.max(to, from + TICK_MINUTES) };
}

/** 目盛りを出す時刻（分）。範囲の両端を含む */
export function gridTicks(range: GridRange): number[] {
  const count = Math.floor((range.to - range.from) / TICK_MINUTES) + 1;
  return Array.from({ length: count }, (_, i) => range.from + i * TICK_MINUTES);
}

/** 時刻（分）の、表示範囲の上端からの位置（px） */
export function gridOffset(range: GridRange, minutes: number): number {
  return (minutes - range.from) * PX_PER_MINUTE;
}

/** 表示範囲全体の高さ（px） */
export function gridHeight(range: GridRange): number {
  return gridOffset(range, range.to);
}

/** 枠の位置と高さ（px）。短い枠でも最低限の高さを確保する */
export function gridBox(range: GridRange, start: number, end: number): { top: number; height: number } {
  return {
    top: gridOffset(range, start),
    height: Math.max((end - start) * PX_PER_MINUTE - SLOT_GAP, MIN_SLOT_HEIGHT),
  };
}

/** ステージごとの枠（ステージの並び順）。ブロックの枠は、中のトークをまとめて1つにする */
export function rowsByStage(day: Day): ListRow[][] {
  const rows: ListRow[][] = day.stages.map(() => []);
  for (const unit of unitsForDay(day)) {
    const stageRows = rows[unit.stageIndex];
    const row = stageRows.find((r) => r.slot === unit.slot);
    if (row) row.units.push(unit);
    else stageRows.push({ slot: unit.slot, units: [unit] });
  }
  return rows;
}

/**
 * ステージごとの、同時中継で映される枠（ステージの並び順）。
 * 中継先のステージの列にも「中継」として出すために使う。選択は元の枠と同じ単位を使う
 */
export function relayRowsByStage(day: Day): ListRow[][] {
  const rows: ListRow[][] = day.stages.map(() => []);
  for (const unit of unitsForDay(day)) {
    for (const relayStage of unit.relayStages) {
      const stageRows = rows[day.stages.indexOf(relayStage)];
      const row = stageRows.find((r) => r.slot === unit.slot);
      if (row) row.units.push(unit);
      else stageRows.push({ slot: unit.slot, units: [unit] });
    }
  }
  return rows;
}

/**
 * ステージが閉まっている時間帯（closed）の位置と高さ（px）。表示範囲からはみ出す分は切り詰め、範囲の外なら null
 */
export function closedBox(range: GridRange, start: number, end: number): { top: number; height: number } | null {
  const from = Math.max(start, range.from);
  const to = Math.min(end, range.to);
  if (to <= from) return null;
  return { top: gridOffset(range, from), height: (to - from) * PX_PER_MINUTE };
}
