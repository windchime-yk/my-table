import { describe, expect, it } from "vitest";
import { loadSelection, saveSelection } from "./storage.ts";

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
    expect(saveSelection("example-fes-2026", "abc123", ["a", "b"], () => storage)).toBe(true);
    expect([...storage.items.keys()]).toEqual(["my-table:v1:example-fes-2026"]);
    expect(loadSelection("example-fes-2026", () => storage)).toMatchObject({ version: "abc123", selected: ["a", "b"] });
  });

  it("ほかのイベントの保存は読まない", () => {
    const storage = memoryStorage();
    saveSelection("example-fes-2026", "abc123", ["a"], () => storage);
    expect(loadSelection("older-conf-2026", () => storage)).toBeNull();
  });

  it("localStorage が使えなくても落ちない", () => {
    expect(loadSelection("example-fes-2026", broken)).toBeNull();
    expect(saveSelection("example-fes-2026", "abc123", ["a"], broken)).toBe(false);
  });

  it("書き込みに失敗したら false を返す（容量超過など）", () => {
    const storage = { getItem: () => null, setItem: broken };
    expect(saveSelection("example-fes-2026", "abc123", ["a"], () => storage)).toBe(false);
  });

  it("壊れた保存は、何も選んでいない状態として読む", () => {
    const storage = memoryStorage();
    storage.items.set("my-table:v1:example-fes-2026", "{");
    expect(loadSelection("example-fes-2026", () => storage)).toBeNull();
  });
});
