// サーバーからブラウザへ渡す初期データ。ページの <script type="application/json"> に埋め込む。
// このファイルは Worker からも読み込むので、zod を import しない（読み取りは src/client/payload.ts）

import type { EventDoc } from "./event.ts";

export interface EventPayload {
  doc: EventDoc;
}

/** 初期データを埋め込む script 要素の id */
export const PAYLOAD_ELEMENT_ID = "payload";
/** ブラウザ側の画面を描く要素の id */
export const APP_ELEMENT_ID = "app";
