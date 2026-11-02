const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** YYYY-MM-DD の曜日（日〜土）。タイムゾーンに左右されないよう UTC で計算する */
export const weekday = (date: string): string => WEEKDAYS[new Date(`${date}T00:00:00Z`).getUTCDay()];

const parts = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  return { y, m, d };
};

/**
 * 開催日の並びを「2026年10月31日（土）〜11月1日（日）」の形にする。
 * 年が同じなら終わりの年を省く。1日だけならその日だけ
 */
export function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return "";
  const sorted = [...dates].sort();
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const a = parts(first);
  const head = `${a.y}年${a.m}月${a.d}日（${weekday(first)}）`;
  if (first === last) return head;
  const b = parts(last);
  const tail = `${b.y === a.y ? "" : `${b.y}年`}${b.m}月${b.d}日（${weekday(last)}）`;
  return `${head}〜${tail}`;
}
