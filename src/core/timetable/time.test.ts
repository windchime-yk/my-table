import { describe, expect, it } from "vitest";
import { formatMinutes, toMinutes } from "./time.ts";

describe("toMinutes", () => {
  it("HH:MM を分にする", () => {
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("09:05")).toBe(545);
    expect(toMinutes("23:59")).toBe(1439);
  });

  it("日をまたぐ時刻は24時以降の分になる", () => {
    expect(toMinutes("24:30")).toBe(1470);
    expect(toMinutes("24:30")).toBeGreaterThan(toMinutes("23:30"));
  });
});

describe("formatMinutes", () => {
  it("分を HH:MM にする", () => {
    expect(formatMinutes(0)).toBe("00:00");
    expect(formatMinutes(545)).toBe("09:05");
  });

  it("24時以降は 24:30 の形のまま出す", () => {
    expect(formatMinutes(1470)).toBe("24:30");
  });

  it.each(["00:00", "12:30", "23:59", "25:15"])("%s を toMinutes と行き来できる", (time) => {
    expect(formatMinutes(toMinutes(time))).toBe(time);
  });
});
