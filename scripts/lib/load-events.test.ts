import { copyFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadEvents } from "./load-events.ts";
import { fixturesDir } from "./fixtures.ts";

const tempDir = () => mkdtempSync(join(tmpdir(), "my-table-events-"));

describe("loadEvents", () => {
  it("公開イベントだけを、新しい開催日順にまとめる", () => {
    const { data, errors } = loadEvents(fixturesDir);
    expect(errors).toEqual([]);
    expect(data.index).toEqual([
      { id: "example-fes-2026", name: "Example Fes 2026", dates: ["2026-12-05", "2026-12-06"] },
      { id: "older-conf-2026", name: "Older Conf 2026", dates: ["2026-04-18"] },
    ]);
    expect(Object.keys(data.events).toSorted()).toEqual(["example-fes-2026", "older-conf-2026"]);
  });

  it("$schema と visibility は同梱せず、元の JSON から作ったバージョンを付ける", () => {
    const event = loadEvents(fixturesDir).data.events["example-fes-2026"];
    expect(event).not.toHaveProperty("$schema");
    expect(event).not.toHaveProperty("visibility");
    expect(event.version).toMatch(/^[0-9a-f]{12}$/);
    expect(loadEvents(fixturesDir).data.events["example-fes-2026"].version).toBe(event.version);
  });

  it("ファイル名がイベントID と違うとエラー", () => {
    const dir = tempDir();
    copyFileSync(join(fixturesDir, "older-conf-2026.json"), join(dir, "older-conf.json"));
    expect(loadEvents(dir).errors).toEqual([
      "older-conf.json: ファイル名をイベントID に合わせて older-conf-2026.json にしてください",
    ]);
  });

  it("JSON として読めないとエラー", () => {
    const dir = tempDir();
    writeFileSync(join(dir, "broken.json"), "{");
    const { errors, data } = loadEvents(dir);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^broken\.json: JSON として読めません/);
    expect(data.index).toEqual([]);
  });

  it("ディレクトリがなければ空", () => {
    expect(loadEvents(join(tempDir(), "events")).data).toEqual({ index: [], events: {} });
  });
});
