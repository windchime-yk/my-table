// 利用者の選択（マイテーブル）。選べる単位の ID を並べたもので、ブラウザの localStorage にだけ保存する

import type { EventDoc } from "../shared/event.ts";
import { isRecord } from "../shared/guard.ts";
import { unitsForDay } from "./unit.ts";

/** localStorage に保存する形 */
export interface Stored {
  /** 保存したときのイベントデータのバージョン。データが更新されたかの判定に使う */
  version: string;
  /** 選んだ単位の ID（枠の id か、トークの id）。選んだ順 */
  selected: string[];
  /** 保存した日時（ISO 8601） */
  updatedAt: string;
}

/** localStorage のキー。v1 は保存する形の版で、イベントごとに分ける */
export const storageKey = (eventId: string): string => `my-table:v1:${eventId}`;

/** 保存する値を作る */
export function buildStored(version: string, selected: string[], now: Date): Stored {
  return { version, selected, updatedAt: now.toISOString() };
}

/**
 * localStorage から読んだ文字列を、保存した形として読む。
 * 壊れている・形が違うときは null（何も選んでいない状態から始める）。
 * 文字列でない ID と重複は取り除く
 */
export function parseStored(raw: string | null): Stored | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isRecord(value) || typeof value.version !== "string" || !Array.isArray(value.selected)) return null;
  const ids = value.selected.filter((id): id is string => typeof id === "string");
  return {
    version: value.version,
    selected: [...new Set(ids)],
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : "",
  };
}

/** 選ぶ・外すを切り替えた、新しい選択を返す。時間が重なる単位も選べる */
export function toggleSelected(selected: string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
}

/** イベント全体で、いま選べる単位の ID */
export function selectableIds(doc: Pick<EventDoc, "days">): Set<string> {
  return new Set(doc.days.flatMap((day) => unitsForDay(day).map((unit) => unit.id)));
}
