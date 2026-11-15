import { describe, expect, it } from "vitest";
import { nowInZone, pickDayIndex } from "./day.ts";

const days = [{ date: "2026-10-31" }, { date: "2026-11-01" }, { date: "2026-11-02" }];

describe("pickDayIndex", () => {
  it("?day= の日を選ぶ", () => {
    expect(pickDayIndex(days, "2026-11-01", "2026-11-02")).toBe(1);
  });

  it("指定がなく、今日が開催日ならその日", () => {
    expect(pickDayIndex(days, null, "2026-11-02")).toBe(2);
  });

  it("指定がなく、今日が開催日でなければ初日", () => {
    expect(pickDayIndex(days, null, "2026-12-01")).toBe(0);
    expect(pickDayIndex(days, null, null)).toBe(0);
  });

  it("存在しない日付の指定は、今日 → 初日 の順で選ぶ", () => {
    expect(pickDayIndex(days, "2026-01-01", "2026-11-01")).toBe(1);
    expect(pickDayIndex(days, "1", "2026-12-01")).toBe(0);
    expect(pickDayIndex(days, "", null)).toBe(0);
  });
});

describe("nowInZone", () => {
  it("イベントのタイムゾーンでの日付と時刻を返す", () => {
    // UTC の 10/31 15:30 は、日本では 11/1 の 0:30
    const now = new Date("2026-10-31T15:30:00Z");
    expect(nowInZone("Asia/Tokyo", now)).toEqual({ date: "2026-11-01", minutes: 30 });
    expect(nowInZone("UTC", now)).toEqual({ date: "2026-10-31", minutes: 930 });
    expect(nowInZone("America/Los_Angeles", now)).toEqual({ date: "2026-10-31", minutes: 510 });
  });

  it("知らないタイムゾーン名は null", () => {
    expect(nowInZone("Nowhere/Unknown", new Date("2026-10-31T15:30:00Z"))).toBeNull();
  });
});
