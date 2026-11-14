import { describe, expect, it } from "vitest";
import { loadEvents } from "../scripts/lib/load-events.ts";
import { CLIENT_SCRIPT, createApp } from "./app.tsx";
import { fixturesDir } from "../scripts/lib/fixtures.ts";
import { isEventPayload } from "./shared/payload.ts";

const app = createApp(loadEvents(fixturesDir).data);
const emptyApp = createApp({ index: [], events: {} });

const get = async (path: string) => (await app.request(path)).text();

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

describe("イベントページ", () => {
  it("イベント名・会場と、noindex の指定を出す", async () => {
    const res = await app.request("/e/example-fes-2026");
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body.startsWith("<!doctype html>")).toBe(true);
    expect(body).toContain("<title>Example Fes 2026 | マイテーブル</title>");
    expect(body).toContain("Example Hall");
    expect(body).toContain('<meta name="robots" content="noindex"/>');
  });

  it("初期データを script 要素に埋め込み、ブラウザ側のスクリプトを読み込む", async () => {
    const body = await get("/e/example-fes-2026");
    const embedded = /<script type="application\/json" id="payload">(.*?)<\/script>/s.exec(body);
    expect(embedded).not.toBeNull();
    const payload: unknown = JSON.parse(embedded?.[1] ?? "null");
    expect(isEventPayload(payload)).toBe(true);
    expect(payload).toMatchObject({ doc: { id: "example-fes-2026", event: { name: "Example Fes 2026" } } });
    expect(body).toContain(`<script type="module" src="${CLIENT_SCRIPT}"></script>`);
    expect(body).toContain('<div id="app">');
  });

  it("ブラウザ側のスクリプトの URL を差し替えられる（開発サーバー用）", async () => {
    const devApp = createApp(loadEvents(fixturesDir).data, { clientScript: "/src/client/main.tsx" });
    const body = await (await devApp.request("/e/example-fes-2026")).text();
    expect(body).toContain('<script type="module" src="/src/client/main.tsx"></script>');
  });

  it("非公式である旨・公式サイトへのリンク・取り込み元を出す", async () => {
    const body = await get("/e/example-fes-2026");
    expect(body).toContain("非公式のマイテーブルです");
    expect(body).toContain('<a href="https://example.com/" target="_blank" rel="noopener noreferrer">公式サイト</a>');
    expect(body).toContain("取り込み元: 公式タイムテーブル画像");
  });

  it("存在しない ID は 404", async () => {
    const res = await app.request("/e/no-such-event");
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("ページが見つかりません");
  });

  it("非公開イベントは 404", async () => {
    const res = await app.request("/e/secret-meetup-2026");
    expect(res.status).toBe(404);
  });

  it("オブジェクトが元から持つ名前をイベントID と取り違えない", async () => {
    const res = await app.request("/e/constructor");
    expect(res.status).toBe(404);
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
