/** @jsxImportSource hono/jsx/dom */
// ブラウザ側の入口。ページに埋め込まれた初期データを読み、タイムテーブルを描く

import { render } from "hono/jsx/dom";
import { reconcile, selectableIds } from "../domain/selection.ts";
import { APP_ELEMENT_ID, isEventPayload, PAYLOAD_ELEMENT_ID } from "../shared/payload.ts";
import { App } from "./App.tsx";
import { loadSelection, saveSelection } from "./storage.ts";

const root = document.getElementById(APP_ELEMENT_ID);
const payloadText = document.getElementById(PAYLOAD_ELEMENT_ID)?.textContent;

if (root && payloadText) {
  const payload: unknown = JSON.parse(payloadText);
  if (isEventPayload(payload)) {
    const { doc } = payload;
    // 保存してある選択を今のデータに合わせる。初期化はせず、なくなった枠だけを外す
    const reconciled = reconcile(loadSelection(doc.id), doc.version, selectableIds(doc));
    const notice =
      reconciled.removed > 0 ? `タイムテーブルが更新され、選んでいた${reconciled.removed}件が外れました。` : null;
    // データが更新されていたら、合わせた結果を今のバージョンで保存し直す（次に開いたときに同じ知らせを出さないため）
    const saveFailed =
      (reconciled.versionChanged || reconciled.removed > 0) && !saveSelection(doc.id, doc.version, reconciled.selected);
    // サーバーが出した「読み込み中…」を消してから描く
    root.textContent = "";
    render(
      <App doc={doc} initialSelected={reconciled.selected} initialNotice={notice} initialSaveFailed={saveFailed} />,
      root,
    );
  }
}
