import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer, type ViteDevServer } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { validEvent } from "./lib/fixtures.ts";
import { events } from "./vite-plugin-events.ts";

const MODULE_ID = "virtual:my-table/events";

const eventJson = (id: string, name = id): string => {
  const doc = validEvent();
  doc.id = id;
  doc.event.name = name;
  return JSON.stringify(doc);
};

// 開発サーバーを、Cloudflare のプラグインなしで立てる。ファイルの監視は環境によって届く時間が変わるので、
// 監視は止めて、監視のイベントをテストから送る
describe("events プラグイン: 開発サーバー", () => {
  let root: string;
  let dir: string;
  let server: ViteDevServer;

  const load = async () => (await server.environments.ssr.transformRequest(MODULE_ID))?.code ?? "";
  const write = (name: string, body: string) => writeFileSync(join(dir, name), body);
  const notify = (type: "add" | "change" | "unlink", path: string) => server.watcher.emit(type, path);

  beforeEach(async () => {
    root = realpathSync(mkdtempSync(join(tmpdir(), "my-table-events-")));
    dir = join(root, "events");
    mkdirSync(dir);
    write("first-fes.json", eventJson("first-fes"));
    server = await createServer({
      configFile: false,
      root,
      logLevel: "silent",
      appType: "custom",
      server: { middlewareMode: true, watch: null, ws: false },
      plugins: [events(dir)],
    });
  });

  afterEach(async () => {
    await server.close();
    rmSync(root, { recursive: true });
  });

  it("ファイルを足すと、仮想モジュールを読み直す", async () => {
    expect(await load()).not.toContain("second-fes");
    write("second-fes.json", eventJson("second-fes"));
    notify("add", join(dir, "second-fes.json"));
    await vi.waitFor(async () => expect(await load()).toContain("second-fes"));
  });

  it("足したファイルの変更も取り込む", async () => {
    await load();
    write("second-fes.json", eventJson("second-fes"));
    notify("add", join(dir, "second-fes.json"));
    await vi.waitFor(async () => expect(await load()).toContain("second-fes"));
    write("second-fes.json", eventJson("second-fes", "Renamed Fes"));
    notify("change", join(dir, "second-fes.json"));
    await vi.waitFor(async () => expect(await load()).toContain("Renamed Fes"));
  });

  it("ファイルを消すと、仮想モジュールを読み直す", async () => {
    expect(await load()).toContain("first-fes");
    rmSync(join(dir, "first-fes.json"));
    notify("unlink", join(dir, "first-fes.json"));
    await vi.waitFor(async () => expect(await load()).not.toContain("first-fes"));
  });

  it("エラーのあるファイルを足して直すと、立ち上げ直さなくても元に戻る", async () => {
    await load();
    write("second-fes.json", "{ broken");
    notify("add", join(dir, "second-fes.json"));
    await vi.waitFor(() => expect(load()).rejects.toThrow("イベントデータにエラーがあります"));
    const send = vi.spyOn(server.environments.ssr.hot, "send");
    write("second-fes.json", eventJson("second-fes"));
    notify("change", join(dir, "second-fes.json"));
    // 直したことが実行環境に伝わらないと、エラーの画面のまま残る
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: "full-reload" })));
    expect(await load()).toContain("second-fes");
  });

  it.each([
    ["JSON でないファイル", "events/memo.txt"],
    ["events/ の外の JSON", "other.json"],
    ["events/ の下のフォルダの JSON", "events/draft/second-fes.json"],
  ])("%s を足しても読み直さない", async (_, path) => {
    await load();
    const { moduleGraph } = server.environments.ssr;
    const invalidate = vi.spyOn(moduleGraph, "invalidateModule");
    const file = join(root, path);
    mkdirSync(join(file, ".."), { recursive: true });
    writeFileSync(file, eventJson("second-fes"));
    notify("add", file);
    // 続けて正しいファイルを足し、その反映が終わるまで待ってから、読み直しが1回だけだったことを確かめる
    write("third-fes.json", eventJson("third-fes"));
    notify("add", join(dir, "third-fes.json"));
    await vi.waitFor(async () => expect(await load()).toContain("third-fes"));
    const id = `\0${MODULE_ID}`;
    expect(invalidate.mock.calls.filter(([mod]) => mod.id === id)).toHaveLength(1);
  });
});
