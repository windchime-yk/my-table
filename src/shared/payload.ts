// サーバーからブラウザへ渡す初期データ。ページの <script type="application/json"> に埋め込む

import type { EventDoc } from "./event.ts";

export interface EventPayload {
  doc: EventDoc;
}

/** 初期データを埋め込む script 要素の id */
export const PAYLOAD_ELEMENT_ID = "payload";
/** ブラウザ側の画面を描く要素の id */
export const APP_ELEMENT_ID = "app";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

/**
 * 埋め込まれた初期データかどうかを確かめる。
 * 中身はビルド時にスキーマでチェック済みなので、ここでは形の入口だけを見る（zod はブラウザに入れない）
 */
export function isEventPayload(value: unknown): value is EventPayload {
  if (!isRecord(value) || !isRecord(value.doc)) return false;
  const { doc } = value;
  return (
    typeof doc.id === "string" && typeof doc.version === "string" && isRecord(doc.event) && Array.isArray(doc.days)
  );
}
