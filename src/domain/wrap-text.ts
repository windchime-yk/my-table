// 幅に合わせた文字列の折り返し。画像（canvas）には自動の折り返しがないので、自分で行に分ける

/** 英数字と記号の連続（1語として扱う）、空白の連続、それ以外の1文字 */
const TOKEN = /[\p{Script=Latin}\p{N}'’.\-()&!?:/]+|\s+|./gsu;
const SPACES = /^\s+$/;

const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
/** 見た目の1文字ごとに分ける（絵文字や結合文字を途中で切らないように） */
const graphemes = (text: string): string[] => Array.from(segmenter.segment(text), (part) => part.segment);

/**
 * 文字列を、幅に収まる行に分ける。
 * - 英数字の連続は1語として扱い、単語の途中では折り返さない（1語が1行に収まらないときだけ、文字単位で分ける）
 * - 日本語などは1文字ずつ折り返せる
 * - maxLines に収まらないときは、最後の行を省略記号（…）で詰める
 * measure は文字列の幅を返す関数（canvas の measureText など）。テストでは文字数で代用できる
 */
export function wrapText(
  text: string,
  maxWidth: number,
  maxLines: number,
  measure: (text: string) => number,
): string[] {
  const fits = (value: string) => measure(value) <= maxWidth;
  const lines: string[] = [];
  let current = "";
  let overflow = false;

  /** いまの行を確定する。次の行を始められるなら true */
  const breakLine = (): boolean => {
    lines.push(current.trimEnd());
    current = "";
    return lines.length < maxLines;
  };

  for (const token of text.match(TOKEN) ?? []) {
    if (overflow) break;
    const isSpace = SPACES.test(token);
    // 行頭の空白は捨てる
    if (current === "" && isSpace) continue;
    if (fits(current + token)) {
      current += token;
      continue;
    }
    // 行末に収まらない空白は捨てる（続く語は、次の行に送られる）
    if (isSpace) continue;
    if (current !== "" && fits(token)) {
      // 語ごと次の行に送る
      if (breakLine()) current = token;
      else overflow = true;
      continue;
    }
    // 1語が1行に収まらないので、文字単位で分ける
    for (const char of graphemes(token)) {
      if (current !== "" && !fits(current + char) && !breakLine()) {
        overflow = true;
        break;
      }
      current += char;
    }
  }

  if (!overflow) {
    if (current.trim() !== "") lines.push(current.trimEnd());
    return lines;
  }

  // 収まりきらなかったので、最後の行を省略記号で詰める
  let last = graphemes(lines.at(-1) ?? "");
  while (last.length > 0 && !fits(`${last.join("")}…`)) last = last.slice(0, -1);
  lines[lines.length - 1] = `${last.join("").trimEnd()}…`;
  return lines;
}
