// イベントデータの整合チェックを手元で実行する。依存パッケージなし（Node でそのまま動く）。
// 使い方:
//   pnpm validate                         events/*.json すべて
//   pnpm validate path/to/event.json ...  指定したファイルだけ
// エラーがあれば終了コード 1。警告だけなら 0。

import { fileURLToPath } from "node:url";
import { checkFile, listEventFiles } from "./lib/load-events.ts";

const eventsDir = fileURLToPath(new URL("../events", import.meta.url));
const args = process.argv.slice(2);
const targets = args.length > 0 ? args : listEventFiles(eventsDir);

if (targets.length === 0) {
  console.log("チェックするイベントデータがありません（events/*.json）");
  process.exit(0);
}

let failed = false;
for (const file of targets) {
  const { doc, errors, warnings } = checkFile(file);
  for (const w of warnings) console.warn(`⚠ ${w}`);
  for (const e of errors) console.error(`✗ ${e}`);
  if (doc) console.log(`✓ ${doc.id}（${doc.days.length}日、${doc.visibility}）`);
  else failed = true;
}
process.exit(failed ? 1 : 0);
