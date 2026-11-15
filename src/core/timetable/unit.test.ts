import { describe, expect, it } from "vitest";
import type { Day } from "../../shared/event.ts";
import { isRunning, timeLabel, unitsForDay, unitTitle } from "./unit.ts";

const day: Day = {
  date: "2026-12-05",
  stages: [
    {
      id: "main",
      name: "Main",
      slots: [
        {
          id: "main-late",
          start: "23:30",
          end: "24:30",
          end_source: "explicit",
          title: "Late",
          category: "performance",
        },
        { id: "main-1230", start: "12:30", end: "13:00", end_source: "inferred", title: "A", category: "performance" },
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
        { id: "sub-1200", start: "12:00", end: "12:30", end_source: "next_slot", title: "B", category: "talk" },
      ],
    },
  ],
};

describe("unitsForDay", () => {
  it("開始時刻 → ステージの並び順 → ブロック内の順番で並べる", () => {
    expect(unitsForDay(day).map((u) => u.id)).toEqual(["sub-1200", "main-1230", "talk-1", "talk-2", "main-late"]);
  });

  it("ブロックの枠はトーク1本ずつに分け、枠の id は選べる単位にしない", () => {
    const units = unitsForDay(day);
    expect(units.some((u) => u.id === "sub-1230")).toBe(false);
    const talk2 = units.find((u) => u.id === "talk-2");
    expect(talk2?.item?.title).toBe("Talk 2");
    expect(talk2?.order).toEqual({ index: 2, total: 2 });
    expect(talk2?.slot.id).toBe("sub-1230");
    expect(talk2?.start).toBe(750);
  });

  it("枠そのものはトークと順番を持たない", () => {
    const unit = unitsForDay(day).find((u) => u.id === "main-1230");
    expect(unit?.item).toBeNull();
    expect(unit?.order).toBeNull();
    expect(unit?.stage.id).toBe("main");
    expect(unit?.stageIndex).toBe(0);
  });

  it("日をまたぐ枠は最後に並ぶ", () => {
    const last = unitsForDay(day).at(-1);
    expect(last?.id).toBe("main-late");
    expect(last?.end).toBe(1470);
  });
});

describe("timeLabel", () => {
  it("終了時刻が公式に書かれているときは「開始–終了」", () => {
    expect(timeLabel({ start: 750, end: 780, endExplicit: true })).toBe("12:30–13:00");
  });

  it("それ以外は開始だけ", () => {
    expect(timeLabel({ start: 750, end: 780, endExplicit: false })).toBe("12:30");
  });

  it("end_source が explicit の枠だけ終了時刻を出す", () => {
    const labels = Object.fromEntries(unitsForDay(day).map((u) => [u.id, timeLabel(u)]));
    expect(labels).toMatchObject({
      "sub-1200": "12:00",
      "main-1230": "12:30",
      "talk-1": "12:30–13:00",
      "main-late": "23:30–24:30",
    });
  });
});

describe("unitTitle", () => {
  it("枠は枠の名前、ブロックの中のトークはトークのタイトル", () => {
    const titles = Object.fromEntries(unitsForDay(day).map((u) => [u.id, unitTitle(u)]));
    expect(titles).toMatchObject({ "main-1230": "A", "talk-2": "Talk 2" });
  });
});

describe("isRunning", () => {
  const unit = { start: 750, end: 780 };

  it("開始から終了の直前までが進行中", () => {
    expect(isRunning(unit, 749)).toBe(false);
    expect(isRunning(unit, 750)).toBe(true);
    expect(isRunning(unit, 779)).toBe(true);
    expect(isRunning(unit, 780)).toBe(false);
  });

  it("その日が「いま」でなければ進行中にしない", () => {
    expect(isRunning(unit, null)).toBe(false);
  });
});

describe("同時中継", () => {
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
            title: "Keynote",
            category: "keynote",
            simulcast_in: ["sub"],
          },
          { id: "main-1300", start: "13:00", end: "13:30", end_source: "explicit", title: "A", category: "talk" },
        ],
      },
      { id: "sub", name: "Sub", slots: [] },
    ],
  };

  it("中継先のステージを持つ。枠は1つのままで、選べる単位は増えない", () => {
    const units = unitsForDay(relayDay);
    expect(units.map((u) => u.id)).toEqual(["main-1200", "main-1300"]);
    expect(units[0].relayStages.map((s) => s.id)).toEqual(["sub"]);
    expect(units[1].relayStages).toEqual([]);
  });
});
