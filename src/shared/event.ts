// イベントデータ（schema/v1/event.schema.json）の型。スキーマを変えたらここも合わせる

export type Visibility = "public" | "private";
export type EndSource = "explicit" | "next_slot" | "inferred" | "day_end";
export type Category = "performance" | "talk" | "keynote" | "workshop" | "ceremony" | "other";
export type DayEventKind = "doors" | "break" | "ceremony" | "party" | "setup" | "close" | "other";

export interface Item {
  id: string;
  title: string;
  speakers?: string[];
  detail?: string | null;
}

export interface Slot {
  id: string;
  start: string;
  end: string;
  end_source: EndSource;
  /** items がある枠だけ null にできる */
  title: string | null;
  category: Category;
  kind_label?: string | null;
  speakers?: string[];
  note?: string | null;
  subtitle?: string | null;
  lang?: string | null;
  tags?: string[];
  simulcast_in?: string[];
  detail?: string | null;
  external_url?: string | null;
  items?: Item[];
}

export interface ClosedRange {
  start: string;
  end: string;
}

export interface Stage {
  id: string;
  name: string;
  color?: string | null;
  hashtag?: string | null;
  closed?: ClosedRange[];
  slots: Slot[];
}

export interface DayEvent {
  start: string;
  end?: string | null;
  title: string;
  kind: DayEventKind;
  stages?: string[];
}

export interface Day {
  date: string;
  label?: string | null;
  end_time?: string | null;
  day_events?: DayEvent[];
  stages: Stage[];
}

export interface EventInfo {
  name: string;
  venue?: string | null;
  timezone: string;
  official_url?: string | null;
  sources?: string[];
  notice?: string | null;
  detail_url_base?: string | null;
}

/** events/*.json の中身 */
export interface EventFile {
  $schema?: string;
  schema_version: "1";
  id: string;
  visibility: Visibility;
  event: EventInfo;
  tag_definitions?: Record<string, string>;
  days: Day[];
}

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
