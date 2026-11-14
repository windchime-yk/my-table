import { describe, expect, it } from "vitest";
import { safeJson } from "./safe-json.ts";

const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);

describe("safeJson", () => {
  it("script 要素を壊す文字を残さない", () => {
    const out = safeJson({ title: "</script><script>alert(1)</script>", note: "<!-- A & B -->" });
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
    expect(out).not.toContain("&");
  });

  it("U+2028・U+2029 を残さない", () => {
    const out = safeJson({ title: `a${LS}b${PS}c` });
    expect(out).not.toContain(LS);
    expect(out).not.toContain(PS);
  });

  it("JSON.parse すると元の値に戻る", () => {
    const value = { title: `</script> & <b>${LS}${PS}`, list: [1, "二", null] };
    const parsed: unknown = JSON.parse(safeJson(value));
    expect(parsed).toEqual(value);
  });
});
