// イベントデータの整合チェック。スキーマ（schema/v1/event.ts）で形を確かめたあと、項目をまたぐ規則を確かめる。
// エラーはビルドを止める。元データ自体の矛盾（休憩と枠の重なりなど）や、当日の急ぎの更新を止めたくない確認漏れは警告に留め、自動では直さない。

import { z } from "zod";
import { eventFileSchema } from "../../schema/v1/event.ts";
import type { EventFile } from "../../src/shared/event.ts";

z.config(z.locales.ja());

export interface ValidationResult {
  errors: string[];
  warnings: string[];
  /** エラーがなければ、チェック済みのデータ */
  doc?: EventFile;
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const formatTime = (minutes: number): string =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

interface Span {
  start: number;
  end: number;
  what: string;
}

/** ["days", 0, "stages"] → "days[0].stages" */
const formatPath = (path: PropertyKey[]): string => {
  let out = "";
  for (const key of path) out += typeof key === "number" ? `[${key}]` : `${out ? "." : ""}${String(key)}`;
  return out || "(ルート)";
};

const isRecord = (v: unknown): v is Record<PropertyKey, unknown> => typeof v === "object" && v !== null;

/** その場所に項目がない（Zod は「型が違う」と報告するので、必須項目の欠落として言い直すため） */
const isMissing = (value: unknown, path: PropertyKey[]): boolean => {
  if (path.length === 0) return false;
  let parent = value;
  for (const key of path.slice(0, -1)) {
    if (!isRecord(parent)) return false;
    parent = parent[key];
  }
  return isRecord(parent) && !(path[path.length - 1] in parent);
};

export function validateEvent(value: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const error = (path: string, message: string) => errors.push(`${path}: ${message}`);
  const warn = (path: string, message: string) => warnings.push(`${path}: ${message}`);

  const parsed = eventFileSchema.safeParse(value);
  // 形が崩れていると以降の規則を正しく確かめられないので、ここで止める
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      error(formatPath(issue.path), isMissing(value, issue.path) ? "必須です" : issue.message);
    }
    return { errors, warnings };
  }

  const doc = parsed.data;
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

    // ステージごとの枠の開始時刻。同時中継の枠は、中継先のステージの枠としても数える
    const slotStarts = new Map<string, number[]>([...stageIds].map((s) => [s, []]));
    for (const stage of day.stages) {
      for (const slot of stage.slots) {
        for (const s of [stage.id, ...(slot.simulcast_in ?? [])]) slotStarts.get(s)?.push(toMinutes(slot.start));
      }
    }

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

        // 押しなどで次の枠だけを動かすと、終了時刻の根拠が合わなくなる
        if (slot.end_source === "next_slot") {
          const later = (slotStarts.get(stage.id) ?? []).filter((s) => s > start);
          if (later.length === 0) {
            warn(p, "end_source が next_slot ですが、同じステージに次の枠がありません");
          } else if (Math.min(...later) !== end) {
            const next = formatTime(Math.min(...later));
            warn(p, `end_source が next_slot ですが、終了 ${slot.end} が次の枠の開始 ${next} と違います`);
          }
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
        if (prev.end > cur.start)
          error(`${dp} ステージ "${stage}"`, `「${prev.what}」と「${cur.what}」の時間が重なっています`);
      }
    }
  });

  return errors.length > 0 ? { errors, warnings } : { errors, warnings, doc };
}
