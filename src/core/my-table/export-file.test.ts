import { describe, expect, it } from "vitest";
import { buildExport, parseImport } from "./export-file.ts";

const doc = { id: "test-fes", version: "v2", event: { name: "Test Fes", timezone: "Asia/Tokyo" } };
const valid = new Set(["a1", "b2", "c3"]);
const now = new Date("2026-11-01T03:00:00Z");

/** 書き出したファイルの一部を書き換えたもの */
const file = (over: Record<string, unknown> = {}) =>
  JSON.stringify({ ...buildExport(doc, ["a1", "b2"], now), ...over });

describe("buildExport", () => {
  it("書き出しファイルの中身を作る", () => {
    expect(buildExport(doc, ["a1", "b2"], now)).toEqual({
      format: "my-table",
      formatVersion: 1,
      eventId: "test-fes",
      eventName: "Test Fes",
      version: "v2",
      selected: ["a1", "b2"],
      exportedAt: "2026-11-01T03:00:00.000Z",
    });
  });
});

describe("parseImport", () => {
  it("書き出したファイルを読み込める", () => {
    expect(parseImport(file(), doc, valid)).toEqual({
      ok: true,
      selected: ["a1", "b2"],
      removed: 0,
      versionChanged: false,
    });
  });

  it("今のデータにない単位は外し、件数を返す", () => {
    expect(parseImport(file({ version: "v1", selected: ["a1", "gone", "c3"] }), doc, valid)).toEqual({
      ok: true,
      selected: ["a1", "c3"],
      removed: 1,
      versionChanged: true,
    });
  });

  it("重複は取り除く", () => {
    expect(parseImport(file({ selected: ["a1", "a1"] }), doc, valid)).toMatchObject({
      ok: true,
      selected: ["a1"],
      removed: 0,
    });
  });

  it("eventName と exportedAt がなくても読み込める", () => {
    expect(parseImport(file({ eventName: undefined, exportedAt: undefined }), doc, valid)).toMatchObject({ ok: true });
  });

  it("JSON でない・形が違うファイルは invalid", () => {
    const invalid = { ok: false, reason: "invalid" };
    expect(parseImport("not json", doc, valid)).toEqual(invalid);
    expect(parseImport("null", doc, valid)).toEqual(invalid);
    expect(parseImport("[]", doc, valid)).toEqual(invalid);
    expect(parseImport(file({ format: "other" }), doc, valid)).toEqual(invalid);
    expect(parseImport(file({ formatVersion: 2 }), doc, valid)).toEqual(invalid);
    expect(parseImport(file({ eventId: 1 }), doc, valid)).toEqual(invalid);
    expect(parseImport(file({ version: undefined }), doc, valid)).toEqual(invalid);
    expect(parseImport(file({ selected: "a1" }), doc, valid)).toEqual(invalid);
    expect(parseImport(file({ selected: ["a1", 1] }), doc, valid)).toEqual(invalid);
  });

  it("localStorage の保存の形（書き出しファイルではない）は invalid", () => {
    expect(parseImport(JSON.stringify({ version: "v2", selected: ["a1"], updatedAt: "" }), doc, valid)).toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("別のイベントのファイルは other_event。イベント名を返す", () => {
    expect(parseImport(file({ eventId: "x", eventName: "X Fes" }), doc, valid)).toEqual({
      ok: false,
      reason: "other_event",
      eventId: "x",
      eventName: "X Fes",
    });
    expect(parseImport(file({ eventId: "x", eventName: undefined }), doc, valid)).toMatchObject({
      reason: "other_event",
      eventName: null,
    });
  });
});
