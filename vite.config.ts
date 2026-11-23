import { cloudflare } from "@cloudflare/vite-plugin";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { events } from "./scripts/vite-plugin-events.ts";

// Worker（wrangler.jsonc の main）を Cloudflare の Vite プラグインでビルド・開発する。
// events/*.json は整合チェックしてから Worker に同梱する
export default defineConfig({
  plugins: [events(fileURLToPath(new URL("./events", import.meta.url))), cloudflare()],
  environments: {
    // ブラウザ側のスクリプト（hono/jsx/dom）。ビルドしたものは Worker の静的アセットとして配信される。
    // Worker が先にビルドされ、ハッシュ付きのファイル名を Worker から参照できないので、名前を固定する
    // （src/app.tsx の CLIENT_SCRIPT と合わせる）。静的アセットは毎回 ETag で確かめられるので、古いものは残らない
    client: {
      build: {
        rolldownOptions: {
          input: fileURLToPath(new URL("./src/client/main.tsx", import.meta.url)),
          output: {
            entryFileNames: "static/client.js",
            chunkFileNames: "static/[name]-[hash].js",
            assetFileNames: "static/[name]-[hash][extname]",
          },
        },
      },
    },
  },
});
