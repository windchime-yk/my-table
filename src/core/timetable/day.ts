// 表示する日の選び方と、イベントのタイムゾーンでの現在時刻

import type { Day } from "../../shared/event.ts";
import { toMinutes } from "./time.ts";

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

/** 1日の分。日をまたぐ枠（"24:30" など）は、この値を超える */
const DAY_MINUTES = 24 * 60;

/** 次の日の日付（YYYY-MM-DD） */
function nextDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
}

/** その日の最後の枠が終わる時刻（分）。枠がなければ 0 */
function lastEnd(day: Day): number {
  return Math.max(0, ...day.stages.flatMap((stage) => stage.slots.map((slot) => toMinutes(slot.end))));
}

/**
 * いまの時刻を、その日の 0:00 からの分で返す。その日が「いま」でなければ null。
 * 日をまたぐ枠がまだ終わっていない間は、翌日の未明も前の日の続き（24時以降）として扱う
 */
export function nowMinutesForDay(day: Day, now: ZonedNow | null): number | null {
  if (!now) return null;
  if (now.date === day.date) return now.minutes;
  if (now.date !== nextDate(day.date)) return null;
  const minutes = now.minutes + DAY_MINUTES;
  return minutes < lastEnd(day) ? minutes : null;
}

/**
 * 「今日」として扱う日付。ふつうは今日の日付だが、
 * 前の日の日をまたぐ枠がまだ終わっていない未明は、前の日を今日として扱う（開いたときに進行中の日を出すため）
 */
export function currentDayDate(days: Day[], now: ZonedNow | null): string | null {
  if (!now) return null;
  const running = days.find((day) => now.date !== day.date && nowMinutesForDay(day, now) !== null);
  return running ? running.date : now.date;
}
