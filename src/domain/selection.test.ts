import { describe, expect, it } from "vitest";
import { fixturesDir } from "../../scripts/lib/fixtures.ts";
import { loadEvents } from "../../scripts/lib/load-events.ts";
import { buildStored, parseStored, reconcile, selectableIds, storageKey, toggleSelected } from "./selection.ts";

describe("storageKey", () => {
  it("イベントごとのキーにする", () => {
    expect(storageKey("example-fes-2026")).toBe("my-table:v1:example-fes-2026");
  });
});

describe("buildStored / parseStored", () => {
  it("保存した値を読み戻せる", () => {
    const stored = buildStored("abc123", ["a", "b"], new Date("2026-11-01T03:00:00Z"));
    expect(stored).toEqual({ version: "abc123", selected: ["a", "b"], updatedAt: "2026-11-01T03:00:00.000Z" });
    expect(parseStored(JSON.stringify(stored))).toEqual(stored);
  });

  it("保存がない・壊れている・形が違うときは null", () => {
    expect(parseStored(null)).toBeNull();
    expect(parseStored("")).toBeNull();
    expect(parseStored("{")).toBeNull();
    expect(parseStored("null")).toBeNull();
    expect(parseStored('["a"]')).toBeNull();
    expect(parseStored('{"selected":["a"]}')).toBeNull();
    expect(parseStored('{"version":"v","selected":"a"}')).toBeNull();
  });

  it("文字列でない ID と重複を取り除く", () => {
    const stored = parseStored('{"version":"v","selected":["a",1,null,"b","a"]}');
    expect(stored).toEqual({ version: "v", selected: ["a", "b"], updatedAt: "" });
  });
});

describe("toggleSelected", () => {
  it("選んでいなければ末尾に足す", () => {
    expect(toggleSelected(["a"], "b")).toEqual(["a", "b"]);
  });

  it("選んでいれば外す", () => {
    expect(toggleSelected(["a", "b"], "a")).toEqual(["b"]);
  });

  it("元の配列を書き換えない", () => {
    const selected = ["a"];
    toggleSelected(selected, "b");
    expect(selected).toEqual(["a"]);
  });
});

describe("selectableIds", () => {
  it("全日の枠と、ブロックの中のトークの ID を集める。ブロックの枠自体は含めない", () => {
    const doc = loadEvents(fixturesDir).data.events["example-fes-2026"];
    const ids = selectableIds(doc);
    expect(ids.has("d1-main-1230")).toBe(true);
    expect(ids.has("talk-1")).toBe(true);
    expect(ids.has("d2-main-1200")).toBe(true);
    expect(ids.has("d1-sub-1230")).toBe(false);
  });
});

describe("reconcile", () => {
  const valid = new Set(["a1", "b2", "c3"]);
  const stored = (version: string, selected: string[]) => ({ version, selected, updatedAt: "" });

  it("なくなった単位だけを外し、外れた件数を返す", () => {
    expect(reconcile(stored("v1", ["a1", "gone", "b2"]), "v2", valid)).toEqual({
      selected: ["a1", "b2"],
      removed: 1,
      versionChanged: true,
    });
  });

  it("重複を除く。重複は外れた件数に数えない", () => {
    expect(reconcile(stored("v1", ["a1", "a1", "gone", "gone"]), "v2", valid)).toEqual({
      selected: ["a1"],
      removed: 1,
      versionChanged: true,
    });
  });

  it("バージョンが変わっても、単位が残っていれば選択はそのまま", () => {
    expect(reconcile(stored("v1", ["c3", "a1"]), "v2", valid)).toEqual({
      selected: ["c3", "a1"],
      removed: 0,
      versionChanged: true,
    });
  });

  it("同じバージョンなら versionChanged は false", () => {
    expect(reconcile(stored("v2", ["a1"]), "v2", valid).versionChanged).toBe(false);
  });

  it("保存がなければ、何も選んでいない状態", () => {
    expect(reconcile(null, "v2", valid)).toEqual({ selected: [], removed: 0, versionChanged: false });
  });
});
