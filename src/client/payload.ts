// ページに埋め込まれた初期データを読む

import { z } from "zod";
import { eventFileSchema } from "../../schema/v1/event.ts";
import type { EventPayload } from "../shared/payload.ts";

/** サイトに同梱するイベント。ファイルの中身から $schema と visibility を除き、ビルド時に付けたバージョンを足したもの */
const eventDocSchema = eventFileSchema.omit({ $schema: true, visibility: true }).extend({ version: z.string() });

const payloadSchema = z.object({ doc: eventDocSchema });

/**
 * 埋め込まれた初期データを読む。JSON として読めない・形が違うときは null。
 * 中身はビルド時に同じスキーマでチェック済みだが、外から来た値を型の決めつけなしで受けるためにここでも確かめる
 */
export function parsePayload(text: string): EventPayload | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  const result = payloadSchema.safeParse(value);
  return result.success ? result.data : null;
}
