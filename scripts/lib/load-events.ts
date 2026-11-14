// events/*.json を読み込み、整合チェックを通った公開イベントだけを、サイトに同梱する形にまとめる。
// - visibility: private のイベントは一切出力しない
// - 元の JSON の SHA-256 の先頭12桁をバージョンとして付ける

import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import type { EventDoc, EventFile, EventsData } from "../../src/shared/event.ts";
import { validateEvent } from "./validate.ts";

export interface CheckedFile {
  path: string;
  /** エラーがなければ中身、あれば null */
  doc: EventFile | null;
  raw: string;
  errors: string[];
  warnings: string[];
}

/** 1ファイルを読んでチェックする。メッセージにはファイル名を付ける */
export function checkFile(path: string): CheckedFile {
  const name = basename(path);
  const raw = readFileSync(path, "utf8");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (e) {
    return {
      path,
      doc: null,
      raw,
      errors: [`${name}: JSON として読めません（${e instanceof Error ? e.message : String(e)}）`],
      warnings: [],
    };
  }
  const result = validateEvent(value);
  const errors = result.errors.map((m) => `${name}: ${m}`);
  const warnings = result.warnings.map((m) => `${name}: ${m}`);
  const { doc } = result;
  if (!doc) return { path, doc: null, raw, errors, warnings };
  if (name !== `${doc.id}.json`) {
    errors.push(`${name}: ファイル名をイベントID に合わせて ${doc.id}.json にしてください`);
    return { path, doc: null, raw, errors, warnings };
  }
  return { path, doc, raw, errors, warnings };
}

export function listEventFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .toSorted()
    .map((f) => join(dir, f));
}

export interface LoadResult {
  data: EventsData;
  files: string[];
  errors: string[];
  warnings: string[];
}

export function loadEvents(dir: string): LoadResult {
  const files = listEventFiles(dir);
  const data: EventsData = { index: [], events: {} };
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const file of files) {
    const checked = checkFile(file);
    errors.push(...checked.errors);
    warnings.push(...checked.warnings);
    const { doc } = checked;
    // ファイル名とイベントID を揃えているので、イベントID は重複しない
    if (!doc) continue;
    if (doc.visibility !== "public") continue;

    // $schema と visibility は同梱しない
    const event: EventDoc = {
      schema_version: doc.schema_version,
      id: doc.id,
      event: doc.event,
      tag_definitions: doc.tag_definitions,
      days: doc.days,
      version: createHash("sha256").update(checked.raw).digest("hex").slice(0, 12),
    };
    data.events[doc.id] = event;
    data.index.push({ id: doc.id, name: doc.event.name, dates: doc.days.map((d) => d.date) });
  }

  // 新しい開催日順。同じ日は名前順
  data.index.sort((a, b) => (b.dates[0] ?? "").localeCompare(a.dates[0] ?? "") || a.name.localeCompare(b.name));
  return { data, files, errors, warnings };
}
