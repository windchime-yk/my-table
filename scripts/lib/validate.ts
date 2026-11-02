// イベントデータの整合チェック。JSON Schema で形を確かめたあと、項目をまたぐ規則を確かめる。
// エラーはビルドを止める。元データ自体の矛盾（休憩と枠の重なりなど）は警告に留め、自動では直さない。

import type { EventFile } from "../../src/shared/event.ts";
import schema from "../../schema/v1/event.schema.json" with { type: "json" };
import { checkSchema, type JsonSchema } from "./json-schema.ts";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

interface Span {
  start: number;
  end: number;
  what: string;
}

export function validateEvent(value: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const error = (path: string, message: string) => errors.push(`${path}: ${message}`);
  const warn = (path: string, message: string) => warnings.push(`${path}: ${message}`);

  for (const e of checkSchema(schema as JsonSchema, value)) error(e.path, e.message);
  // 形が崩れていると以降の規則を正しく確かめられないので、ここで止める
  if (errors.length > 0) return { errors, warnings };

  const doc = value as EventFile;
  const tagDefinitions = doc.tag_definitions ?? {};
  const ids = new Set<string>();
  const claimId = (path: string, id: string) => {
    if (ids.has(id)) error(path, `id "${id}" が重複しています（枠と items を通して一意にしてください）`);
    ids.add(id);
  };
  const dates = new Set<string>();

  doc.days.forEach((day, di) => {
    const dp = `days[${di}]`;
    if (dates.has(day.date)) error(`${dp}.date`, `日付 ${day.date} が重複しています`);
    dates.add(day.date);

    const stageIds = new Set<string>();
    day.stages.forEach((stage, si) => {
      if (stageIds.has(stage.id)) error(`${dp}.stages[${si}].id`, `ステージID "${stage.id}" が重複しています`);
      stageIds.add(stage.id);
    });

    const dayEvents = day.day_events ?? [];
    dayEvents.forEach((ev, ei) => {
      const ep = `${dp}.day_events[${ei}]`;
      if (ev.end != null && toMinutes(ev.end) <= toMinutes(ev.start)) {
        error(ep, `終了 ${ev.end} が開始 ${ev.start} 以前です`);
      }
      for (const s of ev.stages ?? []) if (!stageIds.has(s)) error(`${ep}.stages`, `存在しないステージ "${s}"`);
    });

    // ステージごとの占有時間。同時中継（simulcast_in）は中継先のステージも占有する
    const occupied = new Map<string, Span[]>([...stageIds].map((s) => [s, []]));

    day.stages.forEach((stage, si) => {
      const sp = `${dp}.stages[${si}]`;
      (stage.closed ?? []).forEach((c, ci) => {
        const start = toMinutes(c.start);
        const end = toMinutes(c.end);
        if (end <= start) error(`${sp}.closed[${ci}]`, `終了 ${c.end} が開始 ${c.start} 以前です`);
        occupied.get(stage.id)?.push({ start, end, what: `クローズ（${c.start}-${c.end}）` });
      });

      stage.slots.forEach((slot, ki) => {
        const p = `${sp}.slots[${ki}]`;
        claimId(`${p}.id`, slot.id);
        const start = toMinutes(slot.start);
        const end = toMinutes(slot.end);
        if (end <= start) error(p, `終了 ${slot.end} が開始 ${slot.start} 以前です`);
        if (slot.title === null && !slot.items) error(`${p}.title`, "items がない枠では title が必要です");
        for (const t of slot.tags ?? []) {
          if (!(t in tagDefinitions)) error(`${p}.tags`, `tag_definitions にないタグ "${t}"`);
        }
        (slot.items ?? []).forEach((item, ii) => claimId(`${p}.items[${ii}].id`, item.id));

        const span = { start, end, what: slot.title ?? slot.kind_label ?? slot.id };
        occupied.get(stage.id)?.push(span);
        for (const to of slot.simulcast_in ?? []) {
          if (to === stage.id) error(`${p}.simulcast_in`, "自分のステージは指定できません");
          else if (!stageIds.has(to)) error(`${p}.simulcast_in`, `存在しないステージ "${to}"`);
          else occupied.get(to)?.push({ ...span, what: `${span.what}（中継）` });
        }

        for (const ev of dayEvents) {
          if (ev.kind === "doors" || ev.end == null) continue;
          if (ev.stages && !ev.stages.includes(stage.id)) continue;
          if (start < toMinutes(ev.end) && toMinutes(ev.start) < end) {
            warn(p, `「${ev.title}」(${ev.start}-${ev.end}) と時間が重なっています`);
          }
        }
      });
    });

    for (const [stage, spans] of occupied) {
      spans.sort((a, b) => a.start - b.start);
      for (let i = 1; i < spans.length; i++) {
        const prev = spans[i - 1];
        const cur = spans[i];
        if (prev.end > cur.start) error(`${dp} ステージ "${stage}"`, `「${prev.what}」と「${cur.what}」の時間が重なっています`);
      }
    }
  });

  return { errors, warnings };
}
