// 利用者の選択（マイテーブル）。選べる単位の ID を並べたもので、ブラウザの localStorage にだけ保存する

import { z } from "zod";
import type { EventDoc } from "../shared/event.ts";
import { unitsForDay } from "./unit.ts";

/** 選んだ単位の ID の並び。重複は取り除く */
export const selectedIdsSchema = z.array(z.string()).transform((ids) => [...new Set(ids)]);

/** localStorage に保存する形 */
const storedSchema = z.object({
  /** 保存したときのイベントデータのバージョン。データが更新されたかの判定に使う */
  version: z.string(),
  /** 選んだ単位の ID（枠の id か、トークの id）。選んだ順 */
  selected: selectedIdsSchema,
  /** 保存した日時（ISO 8601）。なくても読めるようにする */
  updatedAt: z.string().catch(""),
});

export type Stored = z.output<typeof storedSchema>;

/** localStorage のキー。v1 は保存する形の版で、イベントごとに分ける */
export const storageKey = (eventId: string): string => `my-table:v1:${eventId}`;

/** 保存する値を作る */
export function buildStored(version: string, selected: string[], now: Date): Stored {
  return { version, selected, updatedAt: now.toISOString() };
}

/**
 * localStorage から読んだ文字列を、保存した形として読む。
 * 壊れている・形が違うときは null（何も選んでいない状態から始める）。重複は取り除く
 */
export function parseStored(raw: string | null): Stored | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = storedSchema.safeParse(value);
  return result.success ? result.data : null;
}

/** 選ぶ・外すを切り替えた、新しい選択を返す。時間が重なる単位も選べる */
export function toggleSelected(selected: string[], id: string): string[] {
  return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
}

/** イベント全体で、いま選べる単位の ID */
export function selectableIds(doc: Pick<EventDoc, "days">): Set<string> {
  return new Set(doc.days.flatMap((day) => unitsForDay(day).map((unit) => unit.id)));
}

/** 保存してあった選択を、今のデータに合わせた結果 */
export interface Reconciled {
  /** 今のデータにある単位だけを残した選択 */
  selected: string[];
  /** なくなって外れた件数 */
  removed: number;
  /** 保存したときからデータのバージョンが変わったか */
  versionChanged: boolean;
}

/**
 * 保存してあった選択を、今のデータに合わせる。初期化はせず、なくなった単位だけを外す。
 * 時刻やステージが変わっただけの枠は ID が同じなので、そのまま残る
 */
export function reconcile(stored: Stored | null, version: string, valid: Set<string>): Reconciled {
  if (!stored) return { selected: [], removed: 0, versionChanged: false };
  const unique = [...new Set(stored.selected)];
  const selected = unique.filter((id) => valid.has(id));
  return { selected, removed: unique.length - selected.length, versionChanged: stored.version !== version };
}
