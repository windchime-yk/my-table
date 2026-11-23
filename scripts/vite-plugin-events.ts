// events/*.json を整合チェックして、仮想モジュール "virtual:my-table/events" として Worker に同梱する Vite プラグイン。
// エラーがあればビルドを止める（開発サーバーではエラーを表示する）。

import { posix } from "node:path";
import { normalizePath, type Plugin } from "vite";
import { loadEvents } from "./lib/load-events.ts";

const MODULE_ID = "virtual:my-table/events";
const RESOLVED_ID = `\0${MODULE_ID}`;

export function events(dir: string): Plugin {
  // Vite が渡すファイルのパスは、OS によらず / 区切り
  const eventsDir = normalizePath(dir);
  const isEventFile = (file: string) => posix.dirname(file) === eventsDir && file.endsWith(".json");

  return {
    name: "my-table:events",
    // 自分の仮想モジュール以外は null を返して、ほかのプラグインに任せる
    resolveId(id) {
      return id === MODULE_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const { data, files, errors, warnings } = loadEvents(dir);
      for (const file of files) this.addWatchFile(file);
      for (const w of warnings) this.warn(w);
      if (errors.length > 0) this.error(`イベントデータにエラーがあります\n${errors.join("\n")}`);
      return `export default ${JSON.stringify(data)};`;
    },
    // 開発サーバーで、ファイルの追加・削除も取り込む。足したファイルはまだ addWatchFile されておらず、
    // チェックでエラーになったときも登録されないので、変更も含めてここで仮想モジュールを読み直す
    hotUpdate({ file, modules }) {
      if (!isEventFile(file)) return undefined;
      const mod = this.environment.moduleGraph.getModuleById(RESOLVED_ID);
      return mod && !modules.includes(mod) ? [...modules, mod] : undefined;
    },
  };
}
