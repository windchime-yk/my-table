import { defineConfig } from "vitest/config";

// テストは Node 上で動かす。Cloudflare の Vite プラグインは読み込まない（vite.config.ts とは別にしている）
// テストは実装の隣に *.test.ts(x) として置く
export default defineConfig({
  test: {
    include: ["{src,scripts,schema}/**/*.test.{ts,tsx}"],
  },
});
