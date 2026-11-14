// schema/v1/event.ts（Zod）から JSON Schema（schema/v1/event.schema.json）を生成する。
// スキーマを変えたら `pnpm schema` を実行してコミットする。生成し忘れはテストで気づける

import { writeFileSync } from "node:fs";
import { toJsonSchema } from "../schema/v1/event.ts";

const out = new URL("../schema/v1/event.schema.json", import.meta.url);
writeFileSync(out, `${JSON.stringify(toJsonSchema(), null, 2)}\n`);
console.log("schema/v1/event.schema.json を生成しました");
