import { Hono } from "hono";
import { html } from "hono/html";
import type { Child } from "hono/jsx";
import schema from "../schema/v1/event.schema.json" with { type: "json" };
import { EventPage } from "./pages/Event.tsx";
import { NotFound } from "./pages/NotFound.tsx";
import { Top } from "./pages/Top.tsx";
import type { EventsData } from "./shared/event.ts";

/** ページを doctype 付きの HTML 文書にする（付けないとブラウザが互換モードで表示する） */
const page = (node: Child) => html`<!doctype html>${node}`;

/** ビルドしたブラウザ側のスクリプト。静的アセットとして配信する（vite.config.ts の出力名と合わせる） */
export const CLIENT_SCRIPT = "/static/client.js";

export interface AppOptions {
  /** イベントページが読み込むブラウザ側のスクリプトの URL。開発サーバーではソースを直接指す */
  clientScript?: string;
  /** すべてのページに入れる、開発サーバー用のスクリプト（Vite のクライアント）の URL。本番では指定しない */
  devClientScript?: string;
}

/** 同梱するイベントデータを受け取ってアプリを作る。テストでは別のデータを渡せる */
export function createApp(data: EventsData, { clientScript = CLIENT_SCRIPT, devClientScript }: AppOptions = {}) {
  const app = new Hono();

  app.get("/", (c) => c.html(page(<Top events={data.index} devClientScript={devClientScript} />)));

  // 同梱しているのは公開イベントだけなので、非公開イベントも存在しない ID と同じ 404 になる
  app.get("/e/:id", (c) => {
    const id = c.req.param("id");
    // "constructor" のようなプロトタイプ上の名前をイベントID と取り違えないよう、自身のキーかを確かめる
    if (!Object.hasOwn(data.events, id)) return c.notFound();
    return c.html(
      page(<EventPage doc={data.events[id]} clientScript={clientScript} devClientScript={devClientScript} />),
    );
  });

  // フォークした人やエディタ・AI エージェントが参照できるよう、イベントデータの JSON Schema を配信する
  app.get("/schema/v1/event.schema.json", (c) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Cache-Control", "public, max-age=3600");
    return c.json(schema);
  });

  app.notFound((c) => c.html(page(<NotFound devClientScript={devClientScript} />), 404));

  return app;
}
