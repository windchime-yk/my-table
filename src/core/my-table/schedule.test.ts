import { describe, expect, it } from "vitest";
import { validEvent } from "../../../scripts/lib/fixtures.ts";
import {
  findScheduleChanges,
  formatScheduleChange,
  MAX_CHANGE_LINES,
  placementsOf,
  placementsSchema,
  updateMessage,
} from "./schedule.ts";

const ALL = ["d1-main-1230", "d1-main-1300", "talk-1", "talk-2", "d2-main-1200"];

/** 今のデータを書き換える前の予定を保存しておき、書き換えたあとの変更を調べる */
const changesAfter = (edit: (doc: ReturnType<typeof validEvent>) => void, selected = ALL) => {
  const doc = validEvent();
  const saved = placementsOf(doc, selected);
  edit(doc);
  const changes = findScheduleChanges(saved, doc, selected);
  return { doc, changes, lines: changes.map((change) => formatScheduleChange(doc, change)) };
};

describe("placementsOf", () => {
  it("選んだ単位の日・ステージ・時刻を集める。推定の終了時刻は持たない", () => {
    expect(placementsOf(validEvent(), ["d1-main-1230", "d1-main-1300", "talk-1", "gone"])).toEqual({
      "d1-main-1230": { date: "2026-12-05", stage: "main", start: "12:30", end: "13:00" },
      "d1-main-1300": { date: "2026-12-05", stage: "main", start: "13:00", end: null },
      "talk-1": { date: "2026-12-05", stage: "sub", start: "12:30", end: "13:00" },
    });
  });
});

describe("placementsSchema", () => {
  it.each([
    ["項目がない（前の版の保存）", undefined],
    ["形が違う", { a: { date: "2026-12-05" } }],
    ["オブジェクトでない", "x"],
  ])("%s ときは空として読む", (_, value) => {
    expect(placementsSchema.parse(value)).toEqual({});
  });
});

describe("findScheduleChanges / formatScheduleChange", () => {
  it("何も変わっていなければ空", () => {
    expect(changesAfter(() => {}).changes).toEqual([]);
  });

  it("開始時刻の変更", () => {
    const { lines } = changesAfter((doc) => {
      Object.assign(doc.days[0].stages[0].slots[1], { start: "13:15", end: "13:45" });
    });
    expect(lines).toEqual(["Artist B 13:00 → 13:15"]);
  });

  it("公式に書かれている終了時刻の変更", () => {
    const { lines } = changesAfter((doc) => {
      doc.days[1].stages[0].slots[0].end = "12:50";
    });
    expect(lines).toEqual(["Keynote 12:00–12:45 → 12:00–12:50"]);
  });

  it("終了時刻が画面に出なくなる変更", () => {
    const { lines } = changesAfter((doc) => {
      doc.days[1].stages[0].slots[0].end_source = "inferred";
    });
    expect(lines).toEqual(["Keynote 12:00–12:45 → 12:00"]);
  });

  it.each<[string, (doc: ReturnType<typeof validEvent>) => void]>([
    ["推定の終了時刻", (doc) => Object.assign(doc.days[0].stages[0].slots[1], { end: "13:40" })],
    ["推定どうしの根拠", (doc) => Object.assign(doc.days[0].stages[0].slots[1], { end_source: "next_slot" })],
    ["タイトル", (doc) => Object.assign(doc.days[0].stages[0].slots[1], { title: "Artist B2" })],
    ["補足", (doc) => Object.assign(doc.days[0].stages[0].slots[1], { note: "ゲストあり" })],
    ["ステージの名前", (doc) => Object.assign(doc.days[0].stages[0], { name: "Big STAGE" })],
    ["選んでいない枠の時刻", (doc) => Object.assign(doc.days[0].stages[0].slots[2], { start: "23:45" })],
  ])("%s の変更は知らせない", (_, edit) => {
    expect(changesAfter(edit).changes).toEqual([]);
  });

  it("ステージの変更には、前後のステージ名を添える", () => {
    const { lines } = changesAfter((doc) => {
      const [main, sub] = doc.days[0].stages;
      sub.slots.push(...main.slots.splice(1, 1));
    });
    expect(lines).toEqual(["Artist B Main STAGE 13:00 → Sub STAGE 13:00"]);
  });

  it("前のステージがなくなっていれば、前のステージ名は出さない", () => {
    const { lines } = changesAfter(
      (doc) => {
        const [main, sub] = doc.days[0].stages;
        main.slots.push(...sub.slots.splice(0, 1));
        doc.days[0].stages.splice(1, 1);
      },
      ["talk-1"],
    );
    expect(lines).toEqual(["Talk 1 12:30–13:00 → Main STAGE 12:30–13:00"]);
  });

  it("日の変更には、前後の日付を添える", () => {
    const { lines } = changesAfter((doc) => {
      doc.days[1].stages[0].slots.push(...doc.days[0].stages[0].slots.splice(1, 1));
    });
    expect(lines).toEqual(["Artist B 12/5(土) 13:00 → 12/6(日) 13:00"]);
  });

  it("ブロックの時刻が変わると、選んだトークごとに出す", () => {
    const { lines } = changesAfter((doc) => {
      Object.assign(doc.days[0].stages[1].slots[0], { start: "12:40", end: "13:10" });
    });
    expect(lines).toEqual(["Talk 1 12:30–13:00 → 12:40–13:10", "Talk 2 12:30–13:00 → 12:40–13:10"]);
  });

  it("保存に予定がない単位は比べない", () => {
    expect(findScheduleChanges({}, validEvent(), ALL)).toEqual([]);
  });

  it("オブジェクトが元から持つ名前の ID を、保存した予定と取り違えない", () => {
    const doc = validEvent();
    doc.days[0].stages[0].slots[0].id = "constructor";
    expect(findScheduleChanges({}, doc, ["constructor"])).toEqual([]);
  });
});

describe("updateMessage", () => {
  const { doc, changes } = changesAfter((d) => {
    d.days[0].stages[0].slots[0].start = "12:40";
  });
  const [change] = changes;

  it("外れても変わってもいなければ null", () => {
    expect(updateMessage(doc, 0, [])).toBeNull();
  });

  it("外れただけなら、件数だけを出す", () => {
    expect(updateMessage(doc, 2, [])).toEqual({
      text: "タイムテーブルが更新され、選んでいた2件が外れました。",
      lines: [],
    });
  });

  it("変わっただけなら、変更前後と、画像の作り直しを促す文を出す", () => {
    expect(updateMessage(doc, 0, [change])).toEqual({
      text: "タイムテーブルが更新され、選んでいた1件の時刻やステージが変わりました。画像を保存している場合は、作り直してください。",
      lines: ["Artist A 12:30–13:00 → 12:40–13:00"],
    });
  });

  it("外れて、変わってもいれば、両方の件数を出す", () => {
    expect(updateMessage(doc, 2, [change])?.text).toContain("選んでいた2件が外れ、1件の時刻やステージが変わりました。");
  });

  it.each([
    [MAX_CHANGE_LINES, MAX_CHANGE_LINES, "Artist A 12:30–13:00 → 12:40–13:00"],
    [MAX_CHANGE_LINES + 2, MAX_CHANGE_LINES + 1, "ほか2件"],
  ])("%i件変わったら%i行で、最後は「%s」", (count, length, last) => {
    const lines = updateMessage(doc, 0, Array(count).fill(change))?.lines ?? [];
    expect(lines).toHaveLength(length);
    expect(lines.at(-1)).toBe(last);
  });
});
