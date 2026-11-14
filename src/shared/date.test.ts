import { describe, expect, it } from "vitest";
import { formatDateRange, shortDate } from "./date.ts";

describe("formatDateRange", () => {
  it("1日だけ", () => {
    expect(formatDateRange(["2026-11-01"])).toBe("2026年11月1日（日）");
  });

  it("同じ年の複数日は、終わりの年を省く", () => {
    expect(formatDateRange(["2026-11-01", "2026-10-31"])).toBe("2026年10月31日（土）〜11月1日（日）");
  });

  it("年をまたぐ", () => {
    expect(formatDateRange(["2026-12-31", "2027-01-01"])).toBe("2026年12月31日（木）〜2027年1月1日（金）");
  });
});

describe("shortDate", () => {
  it("月/日(曜日) にする", () => {
    expect(shortDate("2026-10-31")).toBe("10/31(土)");
    expect(shortDate("2026-01-05")).toBe("1/5(月)");
  });
});
