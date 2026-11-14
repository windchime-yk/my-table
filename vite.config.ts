import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { events } from "./scripts/vite-plugin-events.ts";

// Worker（wrangler.jsonc の main）を Cloudflare の Vite プラグインでビルド・開発する。
// events/*.json は整合チェックしてから Worker に同梱する
export default defineConfig({
  plugins: [events(fileURLToPath(new URL("./events", import.meta.url))), cloudflare()],
});
