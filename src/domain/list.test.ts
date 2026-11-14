import { describe, expect, it } from "vitest";
import type { Day } from "../shared/event.ts";
import { listGroups } from "./list.ts";

const day: Day = {
  date: "2026-12-05",
  day_events: [
    { start: "12:00", end: "12:30", title: "開場", kind: "doors" },
    { start: "15:00", end: "15:30", title: "休憩", kind: "break", stages: ["sub"] },
  ],
  stages: [
    {
      id: "main",
      name: "Main",
      slots: [
        { id: "main-1300", start: "13:00", end: "13:30", end_source: "inferred", title: "B", category: "performance" },
        { id: "main-1230", start: "12:30", end: "13:00", end_source: "explicit", title: "A", category: "performance" },
      ],
    },
    {
      id: "sub",
      name: "Sub",
      slots: [
        {
          id: "sub-1230",
          start: "12:30",
          end: "13:00",
          end_source: "explicit",
          title: null,
          category: "talk",
          items: [
            { id: "talk-1", title: "Talk 1" },
            { id: "talk-2", title: "Talk 2" },
          ],
        },
      ],
    },
  ],
};

const summary = (stageId: string | null) =>
  listGroups(day, stageId).map((g) => ({
    start: g.start,
    dayEvents: g.dayEvents.map((e) => e.title),
    rows: g.rows.map((r) => r.units.map((u) => u.id)),
  }));

describe("listGroups", () => {
  it("開始時刻順にまとめ、day_events を同じ時刻の位置に入れる", () => {
    expect(summary(null)).toEqual([
      { start: 720, dayEvents: ["開場"], rows: [] },
      { start: 750, dayEvents: [], rows: [["main-1230"], ["talk-1", "talk-2"]] },
      { start: 780, dayEvents: [], rows: [["main-1300"]] },
      { start: 900, dayEvents: ["休憩"], rows: [] },
    ]);
  });

  it("ブロックの枠は、中のトークをまとめて1行にする", () => {
    const rows = listGroups(day, "sub").flatMap((g) => g.rows);
    expect(rows).toHaveLength(1);
    expect(rows[0].slot.id).toBe("sub-1230");
    expect(rows[0].units.map((u) => u.id)).toEqual(["talk-1", "talk-2"]);
  });

  it("ステージで絞り込むと、そのステージの枠と day_events、全ステージ共通の day_events だけになる", () => {
    expect(summary("main")).toEqual([
      { start: 720, dayEvents: ["開場"], rows: [] },
      { start: 750, dayEvents: [], rows: [["main-1230"]] },
      { start: 780, dayEvents: [], rows: [["main-1300"]] },
    ]);
    expect(summary("sub")).toEqual([
      { start: 720, dayEvents: ["開場"], rows: [] },
      { start: 750, dayEvents: [], rows: [["talk-1", "talk-2"]] },
      { start: 900, dayEvents: ["休憩"], rows: [] },
    ]);
  });
});
