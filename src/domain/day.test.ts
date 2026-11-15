import { describe, expect, it } from "vitest";
import type { Day } from "../shared/event.ts";
import { currentDayDate, nowInZone, nowMinutesForDay, pickDayIndex } from "./day.ts";

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

/** 23:30〜24:30 の日をまたぐ枠がある日と、その次の日 */
const allNight: Day[] = [
  {
    date: "2026-10-31",
    stages: [
      {
        id: "main",
        name: "Main",
        slots: [
          { id: "d1-1200", start: "12:00", end: "12:30", end_source: "explicit", title: "A", category: "performance" },
          { id: "d1-2330", start: "23:30", end: "24:30", end_source: "explicit", title: "B", category: "performance" },
        ],
      },
    ],
  },
  {
    date: "2026-11-01",
    stages: [
      {
        id: "main",
        name: "Main",
        slots: [
          { id: "d2-1200", start: "12:00", end: "12:30", end_source: "explicit", title: "C", category: "performance" },
        ],
      },
    ],
  },
];

describe("nowMinutesForDay", () => {
  const [day1, day2] = allNight;

  it("その日なら、いまの時刻（分）", () => {
    expect(nowMinutesForDay(day1, { date: "2026-10-31", minutes: 750 })).toBe(750);
  });

  it("ほかの日・時刻が分からないときは null", () => {
    expect(nowMinutesForDay(day1, { date: "2026-10-30", minutes: 750 })).toBeNull();
    expect(nowMinutesForDay(day2, { date: "2026-10-31", minutes: 750 })).toBeNull();
    expect(nowMinutesForDay(day1, null)).toBeNull();
  });

  it("日をまたぐ枠が終わるまでは、翌日の未明も前の日の24時以降として扱う", () => {
    expect(nowMinutesForDay(day1, { date: "2026-11-01", minutes: 10 })).toBe(1450);
  });

  it("日をまたぐ枠が終わったあとは null", () => {
    expect(nowMinutesForDay(day1, { date: "2026-11-01", minutes: 30 })).toBeNull();
    expect(nowMinutesForDay(day1, { date: "2026-11-01", minutes: 600 })).toBeNull();
  });

  it("月をまたぐ日付でも、次の日を正しく求める", () => {
    // day1 は 10/31、次の日は 11/1
    expect(nowMinutesForDay(day1, { date: "2026-11-01", minutes: 0 })).toBe(1440);
  });
});

describe("currentDayDate", () => {
  it("ふつうは今日の日付", () => {
    expect(currentDayDate(allNight, { date: "2026-11-01", minutes: 720 })).toBe("2026-11-01");
    expect(currentDayDate(allNight, { date: "2026-12-01", minutes: 720 })).toBe("2026-12-01");
  });

  it("前の日の日をまたぐ枠が終わっていない未明は、前の日", () => {
    expect(currentDayDate(allNight, { date: "2026-11-01", minutes: 10 })).toBe("2026-10-31");
  });

  it("時刻が分からないときは null", () => {
    expect(currentDayDate(allNight, null)).toBeNull();
  });
});
