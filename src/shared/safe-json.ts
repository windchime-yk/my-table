/**
 * <script type="application/json"> に埋め込める JSON 文字列にする。
 * `</script>` や `<!--` で script 要素が途中で終わらないよう `<` `>` `&` を、
 * 行の区切りとして扱われる U+2028・U+2029 を、\u の形に置き換える（JSON.parse すると元の文字に戻る）。
 * U+2028・U+2029 はソースに生の文字で書くと壊れるので、String.fromCharCode で作る
 */
export function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll(String.fromCharCode(0x2028), "\\u2028")
    .replaceAll(String.fromCharCode(0x2029), "\\u2029");
}
