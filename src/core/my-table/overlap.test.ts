import { describe, expect, it } from "vitest";
import type { Day } from "../../shared/event.ts";
import { findOverlaps } from "./overlap.ts";
import { unitsForDay } from "../timetable/unit.ts";

const day: Day = {
  date: "2026-11-01",
  stages: [
    {
      id: "a",
      name: "A",
      slots: [
        { id: "a1", start: "12:00", end: "12:30", end_source: "next_slot", title: "A1", category: "performance" },
        { id: "a2", start: "12:30", end: "13:00", end_source: "explicit", title: "A2", category: "performance" },
        {
          id: "a3",
          start: "13:00",
          end: "14:00",
          end_source: "explicit",
          title: null,
          category: "talk",
          items: [
            { id: "a3-1", title: "Talk 1" },
            { id: "a3-2", title: "Talk 2" },
          ],
        },
      ],
    },
    {
      id: "b",
      name: "B",
      slots: [
        { id: "b1", start: "12:00", end: "12:20", end_source: "inferred", title: "B1", category: "performance" },
        { id: "b2", start: "12:20", end: "12:40", end_source: "inferred", title: "B2", category: "performance" },
        { id: "b3", start: "12:45", end: "13:15", end_source: "inferred", title: "B3", category: "performance" },
        { id: "b4", start: "13:30", end: "14:00", end_source: "explicit", title: "B4", category: "performance" },
      ],
    },
  ],
};

const pick = (...ids: string[]) => unitsForDay(day).filter((unit) => ids.includes(unit.id));

/** 見やすいよう、相手を ID にする */
const overlapsOf = (id: string, ...ids: string[]) =>
  (findOverlaps(pick(...ids)).get(id) ?? []).map((o) => ({ other: o.other.id, certain: o.certain }));

describe("findOverlaps", () => {
  it("開始が同じなら確実な重なり。両方の単位に入る", () => {
    expect(overlapsOf("a1", "a1", "b1")).toEqual([{ other: "b1", certain: true }]);
    expect(overlapsOf("b1", "a1", "b1")).toEqual([{ other: "a1", certain: true }]);
  });

  it("先に始まる側の終了時刻が推定なら「可能性あり」", () => {
    expect(overlapsOf("b2", "a1", "b2")).toEqual([{ other: "a1", certain: false }]);
  });

  it("先に始まる側の終了時刻が公式に書いてあれば確実", () => {
    expect(overlapsOf("b3", "a2", "b3")).toEqual([{ other: "a2", certain: true }]);
  });

  it("連続する枠は重ならない", () => {
    expect(findOverlaps(pick("a1", "a2")).size).toBe(0);
  });

  it("同じブロックの中のトークどうしは重なりにしない", () => {
    expect(findOverlaps(pick("a3-1", "a3-2")).size).toBe(0);
  });

  it("ブロックの中のトークは、枠の時間で判定する", () => {
    expect(overlapsOf("a3-2", "a3-2", "b4")).toEqual([{ other: "b4", certain: true }]);
  });

  it("複数の相手と重なるときは、すべての相手を返す", () => {
    expect(overlapsOf("a1", "a1", "b1", "b2")).toEqual([
      { other: "b1", certain: true },
      { other: "b2", certain: false },
    ]);
  });

  it("重なりがない単位は結果に入れない", () => {
    const overlaps = findOverlaps(pick("a1", "b1", "b4"));
    expect(overlaps.has("b4")).toBe(false);
    expect(overlaps.size).toBe(2);
  });
});
