import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { toJsonSchema } from "./event.ts";

describe("JSON Schema", () => {
  it("schema/v1/event.schema.json が Zod の定義から生成した最新のものになっている（違えば pnpm schema を実行する）", () => {
    const committed: unknown = JSON.parse(readFileSync(new URL("./event.schema.json", import.meta.url), "utf8"));
    expect(committed).toEqual(toJsonSchema());
  });
});
