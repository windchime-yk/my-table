import { describe, expect, it } from "vitest";
import { fixturesDir } from "../../scripts/lib/fixtures.ts";
import { loadEvents } from "../../scripts/lib/load-events.ts";
import { isEventPayload } from "./payload.ts";
import { safeJson } from "./safe-json.ts";

describe("isEventPayload", () => {
  it("埋め込んだ初期データを読み戻せる", () => {
    const doc = loadEvents(fixturesDir).data.events["example-fes-2026"];
    const parsed: unknown = JSON.parse(safeJson({ doc }));
    expect(isEventPayload(parsed)).toBe(true);
  });

  it("形が違うものは受け付けない", () => {
    expect(isEventPayload(null)).toBe(false);
    expect(isEventPayload("doc")).toBe(false);
    expect(isEventPayload({})).toBe(false);
    expect(isEventPayload({ doc: { id: "x" } })).toBe(false);
    expect(isEventPayload({ doc: { id: "x", version: "1", event: {}, days: "none" } })).toBe(false);
  });
});
