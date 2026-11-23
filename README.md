# my-table

フェスやカンファレンスのタイムテーブルから、見たい枠を選んで自分だけのマイテーブルを作る非公式ツール。

https://mt.whyk.dev

- ログインなし。選んだ枠はブラウザにだけ保存し、サーバーには送らない
- Cloudflare Workers 上の Hono で動かし、Vite と Cloudflare の Vite プラグインでビルドする

設計とデータの流れ、イベントデータの形式（スキーマ）は [docs/SPEC.md](docs/SPEC.md) を参照。

## このリポジトリについて

このリポジトリと https://mt.whyk.dev は、マイテーブルの**リファレンス実装**。個人のプロジェクトなので、イベントデータの追加や更新の依頼には対応しづらい。PR を出してもらえれば、できる範囲で対応する。コードや文書の PR も受けるが、大きな変更は先に Issue で相談してほしい。

ほかのイベントで使いたいときは、このリポジトリをテンプレートにするかフォークして、自分なりのマイテーブルのサイトを作ってほしい。

### 自分のサイトを作る

1. GitHub の「Use this template」かフォークで、自分のリポジトリを作る
2. 次のところを自分のものに置き換える
   - `events/`: 入っているイベントを消し、自分のイベントを置く（[イベントを追加・更新する](#イベントを追加更新する)）
   - `wrangler.jsonc` の `name`: Worker の名前
   - `src/components/Layout.tsx`・`src/pages/Top.tsx`: サイト名・トップの見出し・リポジトリの URL・フッターの名前（`src/app.test.tsx` でも確かめている）
   - `README.md`・`AGENTS.md`: サイトの URL、コミットの作成者、リファレンス実装であることや PR の出し先（残すと、自分のサイト用の PR をエージェントがこのリポジトリに出すおそれがある）
3. Cloudflare Workers にデプロイする。このリポジトリでは Cloudflare Workers Builds を使っている

スキーマを変えないなら、`$schema` の URL はそのまま使える。変えるときは、`schema/v1/event.ts` の `SCHEMA_URL` を自分の URL にして、`pnpm schema` で JSON Schema を作り直す。

## 手元で動かす

Node は `.node-version` のバージョンを使う。pnpm は別に入れておく（Node 26 には Corepack が入っていない）。

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

Skill の本体は `.agents/skills/` にあり、Codex などはここから読む。Claude Code は `.claude/skills/` を読むので、そこに Skill ごとのシンボリックリンクを置いている。

### AI エージェントに PR を出してもらう

1. このリポジトリをフォークし、手元に clone して `pnpm install` を実行する
2. フォークしたフォルダで、Claude Code や Codex を開く
3. 公式のタイムテーブル（画像・URL・テキスト）を渡して、次のように頼む

   ```text
   add-event の手順で、◯◯フェス 2027 を追加して。
   会場は◯◯、公式サイトは https://…、出どころは公式サイト。公開してよい。
   できたら、windchime-yk/my-table に PR を出して
   ```

4. AI の質問に答え、PR を出す前に、データが公式と合っているかを自分で確かめる

時刻変更などは `update-event` の手順で頼む。GitHub CLI（`gh`）でログインしていないときは、PR だけ手で作る。

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

イベントデータ（`events/`）は、公式の情報から時刻や出演者名などの事実を書き出したもの。自分で使うときは、各公式の案内を確認してほしい。
