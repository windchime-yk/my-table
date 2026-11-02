import { Hono } from "hono";
import { html } from "hono/html";
import type { Child } from "hono/jsx";
import { NotFound } from "./pages/NotFound.tsx";
import { Top } from "./pages/Top.tsx";

/** ページを doctype 付きの HTML 文書にする（付けないとブラウザが互換モードで表示する） */
const page = (node: Child) => html`<!doctype html>${node}`;

const app = new Hono();

app.get("/", (c) => c.html(page(<Top />)));

app.notFound((c) => c.html(page(<NotFound />), 404));

export default app;
