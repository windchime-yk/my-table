import { defineConfig } from "vitest/config";

// テストは Node 上で動かす。Cloudflare の Vite プラグインは読み込まない（vite.config.ts とは別にしている）
export default defineConfig({
  test: {
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
