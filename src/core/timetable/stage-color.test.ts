import { describe, expect, it } from "vitest";
import { DEFAULT_STAGE_COLORS, stageColor } from "./stage-color.ts";

describe("stageColor", () => {
  it("データの color があればそれを使う", () => {
    expect(stageColor({ color: "oklch(70% 0.15 30)" }, 0)).toBe("oklch(70% 0.15 30)");
  });

  it("color がなければ、並び順で既定の色を割り当てる", () => {
    expect(stageColor({}, 0)).toBe(DEFAULT_STAGE_COLORS[0]);
    expect(stageColor({ color: null }, 1)).toBe(DEFAULT_STAGE_COLORS[1]);
  });

  it("既定の色より多いステージは、先頭の色に戻る", () => {
    expect(stageColor({}, DEFAULT_STAGE_COLORS.length)).toBe(DEFAULT_STAGE_COLORS[0]);
  });

  it.each(DEFAULT_STAGE_COLORS)("既定の色 %s は OKLCH で書く", (color) => {
    expect(color).toMatch(/^oklch\(/);
  });
});
