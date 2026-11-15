import { describe, expect, it } from "vitest";
import type { Day } from "../shared/event.ts";
import {
  closedBox,
  gridBox,
  gridHeight,
  gridOffset,
  gridRange,
  gridTicks,
  MIN_SLOT_HEIGHT,
  PX_PER_MINUTE,
  relayRowsByStage,
  rowsByStage,
} from "./grid.ts";

const day: Day = {
  date: "2026-12-05",
  day_events: [{ start: "11:40", end: "12:00", title: "開場", kind: "doors" }],
  stages: [
    {
      id: "main",
      name: "Main",
      slots: [
        { id: "main-1200", start: "12:00", end: "12:40", end_source: "explicit", title: "A", category: "performance" },
        { id: "main-2330", start: "23:30", end: "24:10", end_source: "explicit", title: "B", category: "performance" },
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

const emptyDay: Day = { date: "2026-12-06", stages: [{ id: "main", name: "Main", slots: [] }] };

describe("gridRange", () => {
  it("枠と day_events が入る範囲を30分単位に丸める", () => {
    // 11:40 → 11:30、24:10 → 24:30
    expect(gridRange(day)).toEqual({ from: 690, to: 1470 });
  });

  it("枠も day_events もなければ null", () => {
    expect(gridRange(emptyDay)).toBeNull();
  });

  it("終了のない day_events だけでも、30分の高さを持つ", () => {
    const doorsOnly: Day = { ...emptyDay, day_events: [{ start: "12:00", title: "開場", kind: "doors" }] };
    expect(gridRange(doorsOnly)).toEqual({ from: 720, to: 750 });
  });
});

describe("gridTicks", () => {
  it("30分ごとの時刻を、両端を含めて返す", () => {
    expect(gridTicks({ from: 690, to: 780 })).toEqual([690, 720, 750, 780]);
  });
});

describe("gridOffset / gridHeight / gridBox", () => {
  const range = { from: 690, to: 780 };

  it("位置と高さは、1分あたりの高さから決まる", () => {
    expect(gridOffset(range, 690)).toBe(0);
    expect(gridOffset(range, 720)).toBeCloseTo(30 * PX_PER_MINUTE);
    expect(gridHeight(range)).toBeCloseTo(90 * PX_PER_MINUTE);
  });

  it("枠の高さは時間に比例し、枠どうしの間の分だけ短くする", () => {
    const box = gridBox(range, 720, 750);
    expect(box.top).toBeCloseTo(30 * PX_PER_MINUTE);
    expect(box.height).toBeLessThan(30 * PX_PER_MINUTE);
    expect(box.height).toBeGreaterThan(MIN_SLOT_HEIGHT);
  });

  it("短い枠でも最低限の高さを確保する", () => {
    expect(gridBox(range, 720, 725).height).toBe(MIN_SLOT_HEIGHT);
  });
});

describe("rowsByStage", () => {
  it("ステージの並び順に、枠をまとめる。ブロックの枠は1つにする", () => {
    const rows = rowsByStage(day).map((stageRows) => stageRows.map((row) => row.units.map((unit) => unit.id)));
    expect(rows).toEqual([[["main-1200"], ["main-2330"]], [["talk-1", "talk-2"]]]);
  });

  it("枠のないステージは空の配列", () => {
    expect(rowsByStage(emptyDay)).toEqual([[]]);
  });
});

describe("relayRowsByStage", () => {
  const relayDay: Day = {
    date: "2026-12-05",
    stages: [
      {
        id: "main",
        name: "Main",
        slots: [
          {
            id: "main-1200",
            start: "12:00",
            end: "13:00",
            end_source: "explicit",
            title: null,
            category: "talk",
            simulcast_in: ["sub", "lounge"],
            items: [
              { id: "talk-1", title: "Talk 1" },
              { id: "talk-2", title: "Talk 2" },
            ],
          },
          { id: "main-1300", start: "13:00", end: "13:30", end_source: "explicit", title: "A", category: "talk" },
        ],
      },
      { id: "sub", name: "Sub", slots: [] },
      { id: "lounge", name: "Lounge", slots: [] },
    ],
  };

  it("中継先のステージに、中継される枠を入れる。元のステージには入れない", () => {
    const rows = relayRowsByStage(relayDay).map((stageRows) => stageRows.map((row) => row.units.map((u) => u.id)));
    expect(rows).toEqual([[], [["talk-1", "talk-2"]], [["talk-1", "talk-2"]]]);
  });

  it("中継がなければ、どのステージも空", () => {
    expect(relayRowsByStage(day)).toEqual([[], []]);
  });
});

describe("closedBox", () => {
  const range = { from: 720, to: 900 };

  it("閉まっている時間帯の位置と高さ", () => {
    const box = closedBox(range, 780, 840);
    expect(box?.top).toBeCloseTo(60 * PX_PER_MINUTE);
    expect(box?.height).toBeCloseTo(60 * PX_PER_MINUTE);
  });

  it("表示範囲からはみ出す分は切り詰める", () => {
    const box = closedBox(range, 600, 780);
    expect(box?.top).toBe(0);
    expect(box?.height).toBeCloseTo(60 * PX_PER_MINUTE);
  });

  it("表示範囲の外なら null", () => {
    expect(closedBox(range, 600, 720)).toBeNull();
    expect(closedBox(range, 900, 960)).toBeNull();
  });
});
