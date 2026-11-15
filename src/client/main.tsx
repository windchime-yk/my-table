/** @jsxImportSource hono/jsx/dom */
// ブラウザ側の入口。ページに埋め込まれた初期データを読み、タイムテーブルを描く

import { render } from "hono/jsx/dom";
import { APP_ELEMENT_ID, isEventPayload, PAYLOAD_ELEMENT_ID } from "../shared/payload.ts";
import { App } from "./App.tsx";
import { loadSelection } from "./storage.ts";

const root = document.getElementById(APP_ELEMENT_ID);
const payloadText = document.getElementById(PAYLOAD_ELEMENT_ID)?.textContent;

if (root && payloadText) {
  const payload: unknown = JSON.parse(payloadText);
  if (isEventPayload(payload)) {
    const { doc } = payload;
    const initialSelected = loadSelection(doc.id)?.selected ?? [];
    // サーバーが出した「読み込み中…」を消してから描く
    root.textContent = "";
    render(<App doc={doc} initialSelected={initialSelected} />, root);
  }
}
