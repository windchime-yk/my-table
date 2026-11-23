import { describe, expect, it } from "vitest";
import { fixturesDir } from "../../scripts/lib/fixtures.ts";
import { loadEvents } from "../../scripts/lib/load-events.ts";
import { loadSelection, saveSelection } from "./storage.ts";

const doc = loadEvents(fixturesDir).data.events["example-fes-2026"];

/** メモリ上の代わりの保存先 */
const memoryStorage = () => {
  const items = new Map<string, string>();
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
  };
};

const broken = () => {
  throw new Error("localStorage は使えません");
};

describe("saveSelection / loadSelection", () => {
  it("my-table:v1:<eventId> に保存し、読み戻せる", () => {
    const storage = memoryStorage();
    expect(saveSelection(doc, ["d1-main-1300", "talk-1"], () => storage)).toBe(true);
    expect([...storage.items.keys()]).toEqual(["my-table:v1:example-fes-2026"]);
    expect(loadSelection("example-fes-2026", () => storage)).toMatchObject({
      version: doc.version,
      selected: ["d1-main-1300", "talk-1"],
      placements: {
        "d1-main-1300": { date: "2026-12-05", stage: "main", start: "13:00", end: null },
        "talk-1": { date: "2026-12-05", stage: "sub", start: "12:30", end: "13:00" },
      },
    });
  });

  it("ほかのイベントの保存は読まない", () => {
    const storage = memoryStorage();
    saveSelection(doc, ["talk-1"], () => storage);
    expect(loadSelection("older-conf-2026", () => storage)).toBeNull();
  });

  it("localStorage が使えなくても落ちない", () => {
    expect(loadSelection("example-fes-2026", broken)).toBeNull();
    expect(saveSelection(doc, ["talk-1"], broken)).toBe(false);
  });

  it("書き込みに失敗したら false を返す（容量超過など）", () => {
    const storage = { getItem: () => null, setItem: broken };
    expect(saveSelection(doc, ["talk-1"], () => storage)).toBe(false);
  });

  it("壊れた保存は、何も選んでいない状態として読む", () => {
    const storage = memoryStorage();
    storage.items.set("my-table:v1:example-fes-2026", "{");
    expect(loadSelection("example-fes-2026", () => storage)).toBeNull();
  });
});
