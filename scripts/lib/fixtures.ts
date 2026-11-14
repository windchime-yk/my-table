import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { eventFileSchema } from "../../schema/v1/event.ts";
import type { EventFile } from "../../src/shared/event.ts";

export const fixturesDir = fileURLToPath(new URL("./fixtures/events", import.meta.url));

/** 正しいイベントデータ（書き換えて使えるよう、毎回新しく読む） */
export const validEvent = (): EventFile => {
  const raw: unknown = JSON.parse(readFileSync(`${fixturesDir}/example-fes-2026.json`, "utf8"));
  return eventFileSchema.parse(raw);
};
