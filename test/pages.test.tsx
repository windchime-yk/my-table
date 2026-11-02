import { describe, expect, it } from "vitest";
import app from "../src/index.tsx";

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
});

describe("存在しないページ", () => {
  it("404 を返す", async () => {
    const res = await app.request("/no-such-page");
    expect(res.status).toBe(404);
    expect(await res.text()).toContain("ページが見つかりません");
  });
});
