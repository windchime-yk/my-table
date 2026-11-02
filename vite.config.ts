import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

// Worker（wrangler.jsonc の main）を Cloudflare の Vite プラグインでビルド・開発する
export default defineConfig({
  plugins: [cloudflare()],
});
