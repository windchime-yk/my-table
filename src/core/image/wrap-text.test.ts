import { describe, expect, it } from "vitest";
import { wrapText } from "./wrap-text.ts";

/** 1文字の幅を 1 とする */
const measure = (text: string) => text.length;

describe("wrapText", () => {
  it("幅に収まれば1行", () => {
    expect(wrapText("Artist A", 20, 2, measure)).toEqual(["Artist A"]);
  });

  it("空の文字列は行なし", () => {
    expect(wrapText("", 10, 2, measure)).toEqual([]);
  });

  it("英数字の語は、単語の途中で折り返さない", () => {
    expect(wrapText("hello world", 8, 2, measure)).toEqual(["hello", "world"]);
    expect(wrapText("abc def ghi", 7, 2, measure)).toEqual(["abc def", "ghi"]);
  });

  it("日本語は1文字ずつ折り返せる", () => {
    expect(wrapText("あいうえおかきくけこ", 4, 3, measure)).toEqual(["あいうえ", "おかきく", "けこ"]);
  });

  it("日本語と英数字が混ざっていても、英数字の語は分けない", () => {
    expect(wrapText("はじめての TypeScript 入門", 10, 3, measure)).toEqual(["はじめての", "TypeScript", "入門"]);
  });

  it("1語が1行に収まらないときだけ、文字単位で分ける", () => {
    expect(wrapText("abcdefghij", 4, 3, measure)).toEqual(["abcd", "efgh", "ij"]);
  });

  it("行数に収まらないときは、最後の行を省略記号で詰める", () => {
    expect(wrapText("あいうえおかきくけこ", 4, 2, measure)).toEqual(["あいうえ", "おかき…"]);
    expect(wrapText("one two three four", 9, 2, measure)).toEqual(["one two", "three…"]);
  });

  it("1行だけのときも省略記号で詰める", () => {
    expect(wrapText("あいうえおかきくけこ", 5, 1, measure)).toEqual(["あいうえ…"]);
  });

  it("ちょうど収まるときは省略記号を付けない", () => {
    expect(wrapText("あいうえおかきく", 4, 2, measure)).toEqual(["あいうえ", "おかきく"]);
  });

  it("絵文字を途中で切らない", () => {
    const family = "👨‍👩‍👧";
    const lines = wrapText(`${family}${family}${family}`, family.length * 2, 1, measure);
    expect(lines).toEqual([`${family}…`]);
  });

  describe("長い名前を3行に収めるとき", () => {
    const lines = wrapText("The Very Long Name Orchestra feat. Special Guests From Far Away", 12, 3, measure);

    it("3行になる", () => {
      expect(lines).toHaveLength(3);
    });

    it.each(lines)("「%s」は幅を超えない", (line) => {
      expect(measure(line)).toBeLessThanOrEqual(12);
    });
  });
});
