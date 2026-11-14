import { Hono } from "hono";
import { html } from "hono/html";
import type { Child } from "hono/jsx";
import schema from "../schema/v1/event.schema.json" with { type: "json" };
import { NotFound } from "./pages/NotFound.tsx";
import { Top } from "./pages/Top.tsx";
import type { EventsData } from "./shared/event.ts";

/** ページを doctype 付きの HTML 文書にする（付けないとブラウザが互換モードで表示する） */
const page = (node: Child) => html`<!doctype html>${node}`;

/** 同梱するイベントデータを受け取ってアプリを作る。テストでは別のデータを渡せる */
export function createApp(data: EventsData) {
  const app = new Hono();

  app.get("/", (c) => c.html(page(<Top events={data.index} />)));

  // フォークした人やエディタ・AI エージェントが参照できるよう、イベントデータの JSON Schema を配信する
  app.get("/schema/v1/event.schema.json", (c) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Cache-Control", "public, max-age=3600");
    return c.json(schema);
  });

  app.notFound((c) => c.html(page(<NotFound />), 404));

  return app;
}
