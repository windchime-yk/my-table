// イベントデータ v1 のスキーマ。これが唯一の定義元で、次のものはここから作る:
// - 型（src/shared/event.ts）
// - 形のチェック（scripts/lib/validate.ts）
// - JSON Schema（event.schema.json。`pnpm schema` で生成する）
// 項目をまたぐ規則（ID の重複、時間の重なりなど）は JSON Schema で表せないので、scripts/lib/validate.ts に書く。

import { z } from "zod";

export const SCHEMA_URL = "https://mt.whyk.dev/schema/v1/event.schema.json";

const text = z.string().min(1);
const optionalText = text.nullish();
const textList = z.array(text);

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .meta({ id: "date", description: "YYYY-MM-DD" });

const time = z
  .string()
  .regex(/^[0-4]\d:[0-5]\d$/)
  .meta({ id: "time", description: "HH:MM。日をまたぐ深夜帯は 24:30 のように書く" });

const item = z
  .strictObject({
    id: text.meta({ description: "イベント内で一意" }),
    title: text,
    speakers: textList.optional(),
    detail: optionalText,
  })
  .meta({ id: "item" });

const slot = z
  .strictObject({
    id: text.meta({
      description: "イベント内で一意（items の id とも重複しない）。一度公開したら時刻が変わっても変えない",
    }),
    start: time,
    end: time,
    end_source: z.enum(["explicit", "next_slot", "inferred", "day_end"]).meta({
      description:
        "終了時刻の根拠。explicit 公式に記載 / next_slot 次の枠と連続 / inferred 推定 / day_end 終演時刻から",
    }),
    title: text.nullable().meta({ description: "枠の名前。items がある枠だけ null にできる" }),
    category: z.enum(["performance", "talk", "keynote", "workshop", "ceremony", "other"]),
    kind_label: optionalText.meta({ description: "元の表記（LIVE、DJ、10分セッションなど）" }),
    speakers: textList.optional().meta({ description: "出演者・登壇者" }),
    note: optionalText.meta({ description: "補足（ゲスト、押しの情報など）" }),
    subtitle: optionalText,
    lang: optionalText.meta({ description: "言語（ja、en など）" }),
    tags: textList.optional().meta({ description: "tag_definitions に定義したキー" }),
    simulcast_in: textList.optional().meta({ description: "同時中継先のステージID" }),
    detail: optionalText.meta({ description: "詳細ページの URL（または detail_url_base からの相対パス）" }),
    external_url: optionalText.meta({ description: "外部申込などの URL" }),
    items: z
      .array(item)
      .min(1)
      .optional()
      .meta({ description: "1つの枠に、個別の開始時刻なしで複数のトークが入る場合のトーク一覧" }),
  })
  .meta({ id: "slot" });

const closedRange = z.strictObject({ start: time, end: time });

const stage = z
  .strictObject({
    id: text.meta({ description: "日の中で一意" }),
    name: text,
    color: optionalText.meta({ description: "表示色（CSS の色。OKLCH で書く）" }),
    hashtag: optionalText,
    closed: z.array(closedRange).optional().meta({ description: "ステージが閉まっている時間帯" }),
    slots: z.array(slot),
  })
  .meta({ id: "stage" });

const dayEvent = z
  .strictObject({
    start: time,
    end: time.nullish(),
    title: text,
    kind: z.enum(["doors", "break", "ceremony", "party", "setup", "close", "other"]),
    stages: textList.optional().meta({ description: "対象のステージID。省略すると全ステージ共通" }),
  })
  .meta({ id: "dayEvent" });

const day = z
  .strictObject({
    date,
    label: optionalText.meta({ description: "表示名（例: DAY1）" }),
    end_time: time.nullish().meta({ description: "終演時刻" }),
    day_events: z.array(dayEvent).optional().meta({ description: "開場・休憩・懇親会など、選択の対象にしない時間帯" }),
    stages: z.array(stage).min(1),
  })
  .meta({ id: "day" });

const eventInfo = z
  .strictObject({
    name: text.meta({ description: "イベント名" }),
    venue: optionalText.meta({ description: "会場" }),
    timezone: text.meta({ description: "IANA タイムゾーン（例: Asia/Tokyo）" }),
    official_url: optionalText.meta({ description: "公式サイト" }),
    sources: textList.optional().meta({ description: "取り込み元（公式タイムテーブル画像、公式告知など）の説明" }),
    notice: optionalText.meta({ description: "公式の注意書き" }),
    detail_url_base: optionalText.meta({ description: "枠の detail を相対パスで書くときの基準 URL" }),
  })
  .meta({ id: "eventInfo" });

export const eventFileSchema = z
  .strictObject({
    $schema: z.string().optional().meta({ description: "エディタ補完用。このスキーマの URL を書く" }),
    schema_version: z.literal("1"),
    id: z
      .string()
      .regex(/^[a-z0-9][a-z0-9-]*$/)
      .meta({ description: "イベントID。英小文字・数字・ハイフン。ファイル名と揃える。URL（/e/<id>）になる" }),
    visibility: z.enum(["public", "private"]).meta({
      description: "public はサイトに含める。private はビルドから除外する",
    }),
    event: eventInfo,
    tag_definitions: z
      .record(z.string(), text)
      .optional()
      .meta({ description: 'タグのキーと表示名。例: { "no_photo": "撮影禁止" }' }),
    days: z.array(day).min(1),
  })
  .meta({
    title: "マイテーブル イベントデータ v1",
    description:
      "1イベント1ファイル。イベント → 日 → ステージ → 枠 の4階層。時刻はイベントのタイムゾーンでの HH:MM で、日をまたぐ深夜帯は 24:30 のように24時以降で書く。",
  });

/** JSON Schema（event.schema.json）にする */
export function toJsonSchema(): Record<string, unknown> {
  const generated = z.toJSONSchema(eventFileSchema, {
    // meta の id は $defs のキーにだけ使い、JSON Schema 本体には残さない
    override: (ctx) => {
      delete (ctx.jsonSchema as { id?: unknown }).id;
    },
  });
  const { $schema, ...rest } = generated;
  return { $schema, $id: SCHEMA_URL, ...rest };
}
