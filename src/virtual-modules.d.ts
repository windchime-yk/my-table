// Vite プラグイン（scripts/vite-plugin-events.ts）が作る仮想モジュール
declare module "virtual:my-table/events" {
  import type { EventsData } from "./shared/event.ts";

  const data: EventsData;
  export default data;
}
