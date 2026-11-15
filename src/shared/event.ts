// イベントデータの型。schema/v1/event.ts（Zod）の定義から作る

import type { z } from "zod";
import type { eventFileSchema } from "../../schema/v1/event.ts";

/** events/*.json の中身 */
export type EventFile = z.output<typeof eventFileSchema>;
export type Day = EventFile["days"][number];
export type DayEvent = NonNullable<Day["day_events"]>[number];
export type Stage = Day["stages"][number];
export type Slot = Stage["slots"][number];
export type Item = NonNullable<Slot["items"]>[number];

/** ビルド時に付けた情報を足した、サイトに同梱するイベント */
export interface EventDoc extends Omit<EventFile, "$schema" | "visibility"> {
  /** 元の JSON の SHA-256 の先頭12桁。データが変わったかの判定に使う */
  version: string;
}

/** TOP の一覧に出す情報 */
export interface EventSummary {
  id: string;
  name: string;
  dates: string[];
}

/** サイトに同梱するデータ全体 */
export interface EventsData {
  /** 新しい開催日順 */
  index: EventSummary[];
  events: Record<string, EventDoc>;
}
