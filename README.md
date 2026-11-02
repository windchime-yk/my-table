# my-table

フェスやカンファレンスのタイムテーブルから、見たい枠を選んで自分だけのマイテーブルを作る非公式ツール。

https://mt.whyk.dev

- ログインなし。選んだ枠はブラウザにだけ保存し、サーバーには送らない
- Cloudflare Workers 上の Hono で動かし、Vite と Cloudflare の Vite プラグインでビルドする

設計とデータの流れ、イベントデータの形式（スキーマ）は [docs/SPEC.md](docs/SPEC.md) を参照。

## 手元で動かす

Node は `.node-version` のバージョンを使う。

```sh
pnpm install
pnpm dev
```

## イベントデータ

タイムテーブルは `events/<event-id>.json` に1イベント1ファイルで置く。形式は [docs/SPEC.md](docs/SPEC.md#イベントデータ) と [JSON Schema](schema/v1/event.schema.json)（https://mt.whyk.dev/schema/v1/event.schema.json でも配信）を参照。

## スクリプト

| コマンド                      | 内容                                              |
| ----------------------------- | ------------------------------------------------- |
| `pnpm dev`                    | 開発サーバー（Worker を本番に近い環境で動かす）   |
| `pnpm build`                  | ビルド                                            |
| `pnpm preview`                | ビルドして、ビルド結果を手元で確認する            |
| `pnpm lint` / `pnpm lint:fix` | Oxlint による lint（型チェックを含む） / 自動修正 |
| `pnpm fmt` / `pnpm fmt:check` | Oxfmt による整形 / 整形のチェック                 |
| `pnpm test`                   | Vitest によるテスト                               |
| `pnpm validate`               | イベントデータ（`events/*.json`）の整合チェック   |

## ライセンス

コードは [MIT](LICENSE)。
