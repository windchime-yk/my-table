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

タイムテーブルは `events/<event-id>.json` に1イベント1ファイルで置く。形式は [docs/SPEC.md](docs/SPEC.md#イベントデータ) と [JSON Schema](schema/v1/event.schema.json)（https://mt.whyk.dev/schema/v1/event.schema.json でも配信）を参照。スキーマの定義元は Zod で書いた [schema/v1/event.ts](schema/v1/event.ts) で、JSON Schema はそこから生成している。

### イベントを追加・更新する

手順は、AI エージェント用の Skill にまとめている。人が手で作るときも、同じ手順で進められる。

- [イベントを追加する](.agents/skills/add-event/SKILL.md)（`add-event`）: 公式のタイムテーブルから `events/<event-id>.json` を作る
- [イベントのデータを更新する](.agents/skills/update-event/SKILL.md)（`update-event`）: 押し・時刻変更・リトライ・キャンセルを反映する

Skill の本体は `.agents/skills/` にあり、Codex などはここから読む。Claude Code 用の `.claude/skills` は、そこへのシンボリックリンク。

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
| `pnpm schema`                 | Zod の定義から JSON Schema を生成する             |

## ライセンス

コードは [MIT](LICENSE)。
