import { describe, expect, it } from "vitest";
import { loadEvents } from "../scripts/lib/load-events.ts";
import { createApp } from "./app.tsx";
import { fixturesDir } from "../scripts/lib/fixtures.ts";

const app = createApp(loadEvents(fixturesDir).data);
const emptyApp = createApp({ index: [], events: {} });

describe("TOP ページ", () => {
  it("HTML を返す", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("doctype で始まり、検索エンジンに載せない指定がある", async () => {
    const body = await (await app.request("/")).text();
    expect(body.startsWith("<!doctype html>")).toBe(true);
    expect(body).toContain('<meta name="robots" content="noindex"/>');
  });

  it("フッターにコピーライトがある", async () => {
    const body = await (await app.request("/")).text();
    expect(body).toContain("© 2026 WhyK");
  });

  it("公開イベントを新しい順に並べ、非公開イベントは出さない", async () => {
    const body = await (await app.request("/")).text();
    const fes = body.indexOf('href="/e/example-fes-2026"');
    const conf = body.indexOf('href="/e/older-conf-2026"');
    expect(fes).toBeGreaterThan(-1);
    expect(conf).toBeGreaterThan(fes);
    expect(body).toContain("2026年12月5日（土）〜12月6日（日）");
    expect(body).not.toContain("secret-meetup-2026");
  });

  it("公開イベントがなければその旨を出す", async () => {
    const body = await (await emptyApp.request("/")).text();
    expect(body).toContain("公開中のイベントはまだありません。");
  });
});

describe("JSON Schema の配信", () => {
  it("イベントデータのスキーマを返す", async () => {
    const res = await app.request("/schema/v1/event.schema.json");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const schema: unknown = await res.json();
    expect(schema).toMatchObject({ $id: "https://mt.whyk.dev/schema/v1/event.schema.json" });
  });
});

describe("存在しないページ", () => {
  it("404 を返す", async () => {
    const res = await app.request("/no-such-page");
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("ページが見つかりません");
  });
});
