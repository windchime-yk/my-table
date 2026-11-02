import { describe, expect, it } from "vitest";
import { validateEvent } from "../scripts/lib/validate.ts";
import { validEvent } from "./helpers.ts";

const errorsOf = (value: unknown) => validateEvent(value).errors;

describe("validateEvent: スキーマ", () => {
  it("正しいデータはエラーも警告もなく、チェック済みのデータを返す", () => {
    const result = validateEvent(validEvent());
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.doc?.id).toBe("example-fes-2026");
  });

  it("必須項目がないとエラー", () => {
    const doc: Record<string, unknown> = { ...validEvent() };
    delete doc.visibility;
    expect(errorsOf(doc)).toEqual(["visibility: 必須です"]);
  });

  it("schema_version が 1 でないとエラー", () => {
    expect(errorsOf({ ...validEvent(), schema_version: "0.4" })).toEqual([
      'schema_version: 無効な入力: "1"が期待されました',
    ]);
  });

  it("時刻の形式が違うとエラー", () => {
    const doc = validEvent();
    doc.days[0].stages[0].slots[0].start = "9:30";
    expect(errorsOf(doc)).toEqual([
      "days[0].stages[0].slots[0].start: 無効な文字列: パターン/^[0-4]\\d:[0-5]\\d$/に一致する必要があります",
    ]);
  });

  it("列挙値にない値はエラー", () => {
    const doc = validEvent();
    Object.assign(doc.days[0].stages[0].slots[0], { category: "live" });
    expect(errorsOf(doc)[0]).toMatch(/^days\[0\]\.stages\[0\]\.slots\[0\]\.category: 無効な選択: "performance"、/);
  });

  it("スキーマにない項目はエラー（綴りの間違いに気づけるように）", () => {
    const doc = validEvent();
    Object.assign(doc.days[0].stages[0].slots[0], { speaker: ["A"] });
    expect(errorsOf(doc)).toEqual(['days[0].stages[0].slots[0]: 認識されていないキー: "speaker"']);
  });

  it("型が違うとエラー", () => {
    const doc = validEvent();
    Object.assign(doc.days[0].stages[0].slots[0], { speakers: "A" });
    expect(errorsOf(doc)).toEqual([
      "days[0].stages[0].slots[0].speakers: 無効な入力: arrayが期待されましたが、stringが入力されました",
    ]);
  });

  it("任意の項目は null にできる", () => {
    const doc = validEvent();
    doc.event.venue = null;
    doc.days[0].label = null;
    expect(errorsOf(doc)).toEqual([]);
  });
});

describe("validateEvent: 項目をまたぐ規則", () => {
  it("枠と items を通して id が重複するとエラー", () => {
    const doc = validEvent();
    doc.days[1].stages[0].slots[0].id = "talk-1";
    expect(errorsOf(doc)).toEqual([
      'days[1].stages[0].slots[0].id: id "talk-1" が重複しています（枠と items を通して一意にしてください）',
    ]);
  });

  it("終了が開始以前だとエラー", () => {
    const doc = validEvent();
    doc.days[1].stages[0].slots[0].end = "12:00";
    expect(errorsOf(doc)).toEqual(["days[1].stages[0].slots[0]: 終了 12:00 が開始 12:00 以前です"]);
  });

  it("items がない枠の title が null だとエラー", () => {
    const doc = validEvent();
    doc.days[1].stages[0].slots[0].title = null;
    expect(errorsOf(doc)).toEqual(["days[1].stages[0].slots[0].title: items がない枠では title が必要です"]);
  });

  it("定義していないタグはエラー", () => {
    const doc = validEvent();
    doc.days[1].stages[0].slots[0].tags = ["no_video"];
    expect(errorsOf(doc)).toEqual(['days[1].stages[0].slots[0].tags: tag_definitions にないタグ "no_video"']);
  });

  it("同じステージで時間が重なるとエラー", () => {
    const doc = validEvent();
    doc.days[0].stages[0].slots[2].start = "13:15";
    expect(errorsOf(doc)).toEqual(['days[0] ステージ "main": 「Artist B」と「Late Night Set」の時間が重なっています']);
  });

  it("同時中継先の枠と重なってもエラー", () => {
    const doc = validEvent();
    doc.days[0].stages[1].slots[0].end = "13:15";
    expect(errorsOf(doc)).toEqual(['days[0] ステージ "sub": 「10分セッション」と「Artist B（中継）」の時間が重なっています']);
  });

  it("クローズの時間帯と重なるとエラー", () => {
    const doc = validEvent();
    doc.days[0].stages[1].closed = [{ start: "12:45", end: "13:30" }];
    expect(errorsOf(doc)).toContain('days[0] ステージ "sub": 「10分セッション」と「クローズ（12:45-13:30）」の時間が重なっています');
  });

  it("存在しないステージを参照するとエラー", () => {
    const doc = validEvent();
    doc.days[0].stages[0].slots[1].simulcast_in = ["lounge"];
    doc.days[0].day_events = [{ start: "12:00", title: "開場", kind: "doors", stages: ["lounge"] }];
    expect(errorsOf(doc)).toEqual([
      'days[0].day_events[0].stages: 存在しないステージ "lounge"',
      'days[0].stages[0].slots[1].simulcast_in: 存在しないステージ "lounge"',
    ]);
  });

  it("日付やステージID が重複するとエラー", () => {
    const doc = validEvent();
    doc.days[1].date = doc.days[0].date;
    doc.days[0].stages[1].id = "main";
    const errors = errorsOf(doc);
    expect(errors).toContain("days[1].date: 日付 2026-12-05 が重複しています");
    expect(errors).toContain('days[0].stages[1].id: ステージID "main" が重複しています');
  });

  it("休憩などと枠が重なるのは警告に留める", () => {
    const doc = validEvent();
    doc.days[0].stages[1].slots[0].start = "15:00";
    doc.days[0].stages[1].slots[0].end = "15:20";
    const result = validateEvent(doc);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual(["days[0].stages[1].slots[0]: 「休憩」(15:00-15:30) と時間が重なっています"]);
  });
});
