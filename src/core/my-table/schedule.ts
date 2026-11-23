// 選んだ単位の予定（日・ステージ・時刻）。保存したときの予定と今の予定を比べて、変わったものを知らせる

import { z } from "zod";
import { shortDate } from "../../shared/date.ts";
import type { EventDoc } from "../../shared/event.ts";
import { formatMinutes } from "../timetable/time.ts";
import { unitsForDay, unitTitle, type Unit } from "../timetable/unit.ts";

type Days = Pick<EventDoc, "days">;

/** 1つの単位の予定。画面に出るものだけを持つ */
const placementSchema = z.object({
  date: z.string(),
  /** ステージID */
  stage: z.string(),
  start: z.string(),
  /** 公式に書かれている終了時刻。推定の終了時刻は画面に出ないので null にし、変わっても知らせない */
  end: z.string().nullable(),
});

export type Placement = z.output<typeof placementSchema>;

/** 単位の ID ごとの予定。この項目がなかったころの保存や、形が違うときは空（比べずに済ませる） */
export const placementsSchema = z.record(z.string(), placementSchema).catch({});

export type Placements = z.output<typeof placementsSchema>;

const placementOf = (date: string, unit: Unit): Placement => ({
  date,
  stage: unit.stage.id,
  start: formatMinutes(unit.start),
  end: unit.endExplicit ? formatMinutes(unit.end) : null,
});

/** 選んだ単位の、今のデータでの予定 */
export function placementsOf(doc: Days, selected: string[]): Placements {
  const ids = new Set(selected);
  return Object.fromEntries(
    doc.days.flatMap((day) =>
      unitsForDay(day)
        .filter((unit) => ids.has(unit.id))
        .map((unit) => [unit.id, placementOf(day.date, unit)]),
    ),
  );
}

/** 予定が変わった単位 */
export interface ScheduleChange {
  title: string;
  before: Placement;
  after: Placement;
}

const samePlacement = (a: Placement, b: Placement): boolean =>
  a.date === b.date && a.stage === b.stage && a.start === b.start && a.end === b.end;

/** 選んだ単位のうち、保存したときから予定が変わったもの（今の予定の順）。保存に予定がない単位は比べない */
export function findScheduleChanges(saved: Placements, doc: Days, selected: string[]): ScheduleChange[] {
  const ids = new Set(selected);
  return doc.days.flatMap((day) =>
    unitsForDay(day).flatMap((unit) => {
      // "constructor" のようなプロトタイプ上の名前を、保存した予定と取り違えないようにする
      if (!ids.has(unit.id) || !Object.hasOwn(saved, unit.id)) return [];
      const before = saved[unit.id];
      const after = placementOf(day.date, unit);
      return samePlacement(before, after) ? [] : [{ title: unitTitle(unit), before, after }];
    }),
  );
}

/** 変わった予定を「Artist A 12:30 → 12:50」の形にする。日とステージは、変わったときだけ添える */
export function formatScheduleChange(doc: Days, { title, before, after }: ScheduleChange): string {
  const label = (p: Placement): string => {
    const stage = doc.days.find((day) => day.date === p.date)?.stages.find((s) => s.id === p.stage);
    return [
      before.date === after.date ? null : shortDate(p.date),
      // 前のステージが今のデータになければ、名前が分からないので出さない
      before.stage === after.stage ? null : stage?.name,
      p.end === null ? p.start : `${p.start}–${p.end}`,
    ]
      .filter(Boolean)
      .join(" ");
  };
  return `${title} ${label(before)} → ${label(after)}`;
}

/** 知らせに並べる変更の数。これより多い分は件数だけを出す */
export const MAX_CHANGE_LINES = 5;

/** データの更新で、選んでいた単位が外れた・変わったことの知らせ。どちらもなければ null */
export function updateMessage(
  doc: Days,
  removed: number,
  changes: ScheduleChange[],
): { text: string; lines: string[] } | null {
  const changed = changes.length;
  if (removed === 0 && changed === 0) return null;
  if (changed === 0) return { text: `タイムテーブルが更新され、選んでいた${removed}件が外れました。`, lines: [] };
  const what = removed > 0 ? `${removed}件が外れ、${changed}件` : `${changed}件`;
  const lines = changes.slice(0, MAX_CHANGE_LINES).map((change) => formatScheduleChange(doc, change));
  if (changed > MAX_CHANGE_LINES) lines.push(`ほか${changed - MAX_CHANGE_LINES}件`);
  return {
    text: `タイムテーブルが更新され、選んでいた${what}の時刻やステージが変わりました。画像を保存している場合は、作り直してください。`,
    lines,
  };
}
