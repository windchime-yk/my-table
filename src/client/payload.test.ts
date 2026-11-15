import { describe, expect, it } from "vitest";
import { fixturesDir } from "../../scripts/lib/fixtures.ts";
import { loadEvents } from "../../scripts/lib/load-events.ts";
import { safeJson } from "../shared/safe-json.ts";
import { parsePayload } from "./payload.ts";

const doc = loadEvents(fixturesDir).data.events["example-fes-2026"];

describe("parsePayload", () => {
  it("埋め込んだ初期データを読み戻せる", () => {
    expect(parsePayload(safeJson({ doc }))).toEqual({ doc });
  });

  it("JSON として読めないものは null", () => {
    expect(parsePayload("")).toBeNull();
    expect(parsePayload("{")).toBeNull();
  });

  it("形が違うものは null", () => {
    expect(parsePayload("null")).toBeNull();
    expect(parsePayload('"doc"')).toBeNull();
    expect(parsePayload("{}")).toBeNull();
    expect(parsePayload(JSON.stringify({ doc: { id: "x" } }))).toBeNull();
  });

  it("バージョンのないイベントは null", () => {
    const { version: _version, ...withoutVersion } = doc;
    expect(parsePayload(JSON.stringify({ doc: withoutVersion }))).toBeNull();
  });

  it("スキーマにない項目があるイベントは null", () => {
    expect(parsePayload(JSON.stringify({ doc: { ...doc, unknown_field: 1 } }))).toBeNull();
  });
});
