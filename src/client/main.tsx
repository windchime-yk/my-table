/** @jsxImportSource hono/jsx/dom */
// ブラウザ側の入口。ページに埋め込まれた初期データを読み、タイムテーブルを描く

import { render } from "hono/jsx/dom";
import { APP_ELEMENT_ID, PAYLOAD_ELEMENT_ID } from "../shared/payload.ts";
import { App } from "./App.tsx";
import { parsePayload } from "./payload.ts";

const root = document.getElementById(APP_ELEMENT_ID);
const payload = parsePayload(document.getElementById(PAYLOAD_ELEMENT_ID)?.textContent ?? "");

if (root && payload) {
  // サーバーが出した「読み込み中…」を消してから描く
  root.textContent = "";
  render(<App doc={payload.doc} />, root);
}
