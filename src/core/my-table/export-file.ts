// マイテーブルの書き出しファイル。ログインがない代わりの、控えと別の端末への移行の手段

import { z } from "zod";
import type { EventDoc } from "../../shared/event.ts";
import { reconcile, selectedIdsSchema } from "./selection.ts";

export const FILE_FORMAT = "my-table";
export const FILE_FORMAT_VERSION = 1;

/** 書き出しファイルの形 */
const exportFileSchema = z.object({
  /** このツールの書き出しファイルであることの目印 */
  format: z.literal(FILE_FORMAT),
  /** ファイルの形の版。知らない版は読み込まない */
  formatVersion: z.literal(FILE_FORMAT_VERSION),
  eventId: z.string(),
  /** 別のイベントのファイルを読み込もうとしたときに、名前で知らせるためのもの */
  eventName: z.string().nullish(),
  /** 書き出したときのイベントデータのバージョン */
  version: z.string(),
  selected: selectedIdsSchema,
  /** 書き出した日時（ISO 8601）。読み込みには使わない */
  exportedAt: z.string().nullish(),
});

export type ExportFile = z.output<typeof exportFileSchema>;

/** 書き出しファイルの中身を作る。選択は全日分 */
export function buildExport(
  doc: Pick<EventDoc, "id" | "version" | "event">,
  selected: string[],
  now: Date,
): ExportFile {
  return {
    format: FILE_FORMAT,
    formatVersion: FILE_FORMAT_VERSION,
    eventId: doc.id,
    eventName: doc.event.name,
    version: doc.version,
    selected,
    exportedAt: now.toISOString(),
  };
}

export type ImportResult =
  /** 読み込めた。selected は今のデータに合わせたもの、removed はなくなって外れた件数 */
  | { ok: true; selected: string[]; removed: number; versionChanged: boolean }
  /** このツールの書き出しファイルではない・壊れている */
  | { ok: false; reason: "invalid" }
  /** 別のイベントのファイル */
  | { ok: false; reason: "other_event"; eventId: string; eventName: string | null };

/**
 * 書き出しファイルを読む。形が違う・別のイベントのファイルは読み込まない。
 * 読み込んだ選択は今のデータに合わせ、なくなった単位は外す
 */
export function parseImport(text: string, doc: Pick<EventDoc, "id" | "version">, valid: Set<string>): ImportResult {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, reason: "invalid" };
  }
  const result = exportFileSchema.safeParse(value);
  if (!result.success) return { ok: false, reason: "invalid" };
  const file = result.data;
  if (file.eventId !== doc.id) {
    return { ok: false, reason: "other_event", eventId: file.eventId, eventName: file.eventName ?? null };
  }
  const reconciled = reconcile(file, doc.version, valid);
  return { ok: true, ...reconciled };
}
