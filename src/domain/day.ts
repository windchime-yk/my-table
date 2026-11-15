// 表示する日の選び方と、イベントのタイムゾーンでの現在時刻

/** イベントのタイムゾーンでの、いまの日付と時刻 */
export interface ZonedNow {
  /** YYYY-MM-DD */
  date: string;
  /** その日の 0:00 からの分 */
  minutes: number;
}

/**
 * イベントのタイムゾーンでの現在時刻。閲覧者の端末のタイムゾーンには左右されない。
 * タイムゾーン名をブラウザが知らないときは null（今日かどうかの判定をしない）
 */
export function nowInZone(timeZone: string, now: Date): ZonedNow | null {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(now);
  } catch {
    return null;
  }
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
  };
}

/**
 * 開いたときに表示する日（days の中の位置）を選ぶ。
 * ?day=YYYY-MM-DD の日 → 今日が開催日ならその日 → 初日 の順。
 * 存在しない日付が指定されたときも、同じ規則で残りから選ぶ
 */
export function pickDayIndex(days: { date: string }[], dayParam: string | null, today: string | null): number {
  const byParam = dayParam === null ? -1 : days.findIndex((day) => day.date === dayParam);
  if (byParam >= 0) return byParam;
  const byToday = today === null ? -1 : days.findIndex((day) => day.date === today);
  return Math.max(byToday, 0);
}
