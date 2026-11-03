// events/*.json を整合チェックして、仮想モジュール "virtual:my-table/events" として Worker に同梱する Vite プラグイン。
// エラーがあればビルドを止める（開発サーバーではエラーを表示する）。

import type { Plugin } from "vite";
import { loadEvents } from "./lib/load-events.ts";

const MODULE_ID = "virtual:my-table/events";
const RESOLVED_ID = `\0${MODULE_ID}`;

export function events(dir: string): Plugin {
  return {
    name: "my-table:events",
    // 自分の仮想モジュール以外は null を返して、ほかのプラグインに任せる
    resolveId(id) {
      return id === MODULE_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const { data, files, errors, warnings } = loadEvents(dir);
      // 既存ファイルの変更は自動で取り込む。ファイルを足したときは開発サーバーを立ち上げ直す
      for (const file of files) this.addWatchFile(file);
      for (const w of warnings) this.warn(w);
      if (errors.length > 0) this.error(`イベントデータにエラーがあります\n${errors.join("\n")}`);
      return `export default ${JSON.stringify(data)};`;
    },
  };
}
