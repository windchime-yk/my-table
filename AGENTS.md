# AGENTS.md

AI エージェント（Claude Code など）がこのリポジトリで作業するときの約束事。人が読んでも同じ内容で通じるように書いている。仕様の詳細は [docs/SPEC.md](docs/SPEC.md)、使い方は [README.md](README.md) を参照。

## このリポジトリ

フェスやカンファレンスのタイムテーブルを静的データ（JSON）にしておき、利用者がブラウザだけで「マイテーブル」（見たい枠だけの自分用タイムテーブル）を作る非公式ツール。本番は https://mt.whyk.dev 。

- 個人用・内向きのツール。機能や画面はシンプルさを優先する
- 非公式。イベントの主催者・出演者とは関係がない。全ページ `noindex`
- ログインなし。利用者の選択はブラウザの localStorage にだけ保存し、サーバーには送らない
- タイムテーブルのデータは、公式の情報から AI エージェントや手作業で JSON を組み立て、`events/` に置く

## 作業の進め方

- 作業は GitHub Issue 単位で行う。1 Issue につき1ブランチ・1 PR。PR の説明に `Closes #<番号>` を書く
- ブランチ名は `feat/…` `fix/…` `chore/…` `docs/…` `ci/…`
- PR のタイトルは Conventional Commits（例: `feat: add event page`）。マージは Squash
- コミットメッセージも Conventional Commits で、英語で書く。PR の説明・ドキュメント・コード内のコメント・画面の文言は日本語
- コミットの作成者は `WhyK <16016681+windchime-yk@users.noreply.github.com>`。個人のメールアドレスを履歴に載せない
- main に直接 push しない。デプロイは main へのマージで自動で走る
- 機能を足したら、関係する docs/SPEC.md・README.md もその PR で更新する

## コマンド

| コマンド                      | 内容                                            |
| ----------------------------- | ----------------------------------------------- |
| `pnpm install`                | 依存のインストール                              |
| `pnpm dev`                    | 開発サーバー（Worker を本番に近い環境で動かす） |
| `pnpm build`                  | ビルド                                          |
| `pnpm lint`                   | Oxlint（型チェックを含む）                      |
| `pnpm fmt` / `pnpm fmt:check` | Oxfmt による整形 / 整形のチェック               |
| `pnpm test`                   | Vitest                                          |
| `pnpm validate [file...]`     | イベントデータの整合チェック                    |
| `pnpm schema`                 | Zod の定義から JSON Schema を生成する           |

PR を出す前に `pnpm fmt` → `pnpm lint` → `pnpm test` → `pnpm build` を通す。CI（`.github/workflows/ci.yml`）も同じ順で確かめる。

## 構成

```
events/<event-id>.json        イベントデータ（1イベント1ファイル）
schema/v1/event.ts            スキーマの定義（Zod）。唯一の定義元
schema/v1/event.schema.json   JSON Schema（生成物。手で編集しない）
scripts/lib/                  整合チェックとデータの読み込み（ビルド時に使う）
scripts/vite-plugin-events.ts events/ をチェックして Worker に同梱する Vite プラグイン
src/app.tsx                   Hono のアプリ（createApp にイベントデータを渡す）
src/index.tsx                 Worker の入口
src/pages/ src/components/    サーバーが返す画面（hono/jsx）
src/client/                   ブラウザ側の画面（hono/jsx/dom）。入口は main.tsx、状態は App.tsx
src/client/components/        ブラウザ側の UI ごとの部品（スタイルも同じファイルに置く）
src/core/                     画面から切り離したロジック（純粋な関数。DOM に依存しない）。機能ごとのフォルダに分ける
  timetable/                  タイムテーブルの組み立て（時刻・選べる単位・リスト・横並び・ステージ色・日の選び方と現在時刻）
  my-table/                   利用者の選択（保存する形・データ更新への追従・時間の重なり・書き出しファイル）
  image/                      画像（文字の折り返し）
src/shared/                   型と、サーバー・ブラウザの両方で使う関数
src/styles.ts                 テーマと、サーバー側の複数のページで使うスタイル（hono/css）
src/client/styles.ts          ブラウザ側の画面全体で使うスタイル
docs/SPEC.md                  設計・データの流れ・スキーマ・データ作成の指針
.agents/skills/               AI エージェント用の Skill（イベントの追加 add-event、更新 update-event）
.claude/skills/<name>         .agents/skills/<name> へのシンボリックリンク（Claude Code 用。中身は二重に持たない）
```

## 技術の決定

- **実行環境**: Cloudflare Workers 上の Hono。ビルドは Vite ＋ `@cloudflare/vite-plugin`。HonoX・Void は使わない
- **画面**: サーバーは hono/jsx、ブラウザ側の操作は hono/jsx/dom。React などは入れない。ブラウザ側のファイルは先頭に `/** @jsxImportSource hono/jsx/dom */` を書き、スタイルは `hono/jsx/dom/css` を使う
- **ブラウザ側のビルド**: Vite の `client` 環境で `src/client/main.tsx` をビルドし、Worker の静的アセット（`/static/client.js`）として配信する。Worker が先にビルドされるのでファイル名は固定。開発サーバーでは `/src/client/main.tsx` を直接読み込む
- **スタイル**: hono/css。スタイルは使う部品・ページと同じファイルに置き（コロケーション）、画面全体で使うものだけを `src/styles.ts`（サーバー側）・`src/client/styles.ts`（ブラウザ側）に置く。特定の UI の仲間うちで使うものは、その近くに置く（枠のカードは `src/client/components/card-styles.ts`）。クラスの組み合わせは必ず `cx()` を使う（テンプレート文字列でつなぐとサーバー側で `document is not defined` になる）
- **色**: OKLCH で書く。テーマの色は `src/styles.ts` の CSS 変数にまとめ、無彩色寄りの色は色相 255 にそろえる。データのステージ色も OKLCH
- **パッケージ管理**: pnpm（`packageManager` に正確なバージョン）。Bun は使わない。依存のビルドスクリプトは `pnpm-workspace.yaml` の `allowBuilds` で許可する
- **Node.js**: `.node-version`（最新の Active LTS）。スクリプトは TypeScript のまま Node で直接実行する（型を取り除くだけで動く書き方。`tsx` などは入れない。import には `.ts` 拡張子を付ける）
- **lint / format**: Oxlint ＋ Oxfmt。型チェックも Oxlint（type-aware）で行い、`tsc` は使わない（TypeScript 7 前提）
- **テスト**: Vitest。テストは実装の隣に `*.test.ts(x)` で置く。同じ確認を複数の値で繰り返すときは、for 文ではなく `it.each` を使う。Hono のページは `app.request()` で確かめる
- **スキーマ**: Zod 4 の `schema/v1/event.ts` が唯一の定義元。型は `z.output` で作り、手で型を書かない。JSON Schema は `pnpm schema` で生成してコミットする（一致はテストで確かめる）。zod は、ビルド時のデータのチェックと、ブラウザ側で外から来たデータ（ページに埋め込んだ初期データ・localStorage・書き出しファイル）を読むときに使う。手書きの型ガードは書かない。ブラウザ側も通常の `zod` を使い、`zod/mini` は使わない（JS は gzip で約 18 kB 小さくなるが、書き方が2通りになるのを避けた）。Worker には入れない（`src/app.tsx` から読み込むファイルでは zod を import しない。型だけの `import type` はよい）
- **データの同梱**: Vite プラグインが `events/*.json` をチェックし、公開分だけを仮想モジュール `virtual:my-table/events` として Worker に入れる。生成ファイルは置かない
- **デプロイ**: Cloudflare Workers Builds だけ。main は本番、それ以外のブランチはプレビュー（`wrangler preview`）。GitHub Actions はチェックだけでデプロイしない。デプロイの経路を2本にしない（以前、2経路が互いに上書きして古いデータが本番に出た）

## 設計の方針

- クラスを使った DDD（エンティティ・リポジトリ・集約）はしない。データは Zod から作った型のまま扱い、ロジックは純粋な関数で書く
- 時刻、選べる単位（枠、またはブロック内のトーク1本）、時間の重なり、データ更新への追従などのロジックは `src/core/` に置き、DOM に依存させずにテストする。フォルダ名は、DDD の用語と紛れないよう `domain` ではなく `core` にしている
- 用語は docs/SPEC.md とコードでそろえる（イベント・日・ステージ・枠・トーク・押し・リトライ・マイテーブル）
- データを作る側（ビルド時）と、利用者のマイテーブル（ブラウザ）は、公開しているスキーマだけでつなぐ
- サーバーからブラウザへの初期データは `<script type="application/json">` に埋め込む。`<` `>` `&` と U+2028・U+2029 をエスケープする（U+2028 をソースに生の文字で書くと壊れるので `String.fromCharCode` を使う）

## コードの書き方

- 型の決めつけ（`as`）は避け、Zod で絞り込む。`JSON.parse` の結果は `unknown` で受ける
- 配列の並べ替えは `toSorted()` を使う（元の配列を書き換えない）
- コメントは日本語で、なぜそうしているかを書く
- Zod のエラー文言は版によって変わるので、テストでは文言ではなくエラーの場所を確かめる
- localStorage は使えない・消えることがある前提で、読み書きの失敗で落ちないようにする

## データのルール

詳しくは docs/SPEC.md の「イベントデータ」。イベントを追加・更新するときは、Skill（`add-event`・`update-event`）の手順で進める。決まりを変えたら、SPEC とあわせて Skill も直す。Skill を足すときは、本体を `.agents/skills/<name>/` に置き、`.claude/skills/<name>` からシンボリックリンクを張る（`ln -s ../../.agents/skills/<name> .claude/skills/<name>`）。特に守ること:

- 枠の `id` は一度公開したら、時刻やステージが変わっても変えない（利用者の保存がこの ID に紐づく）
- 押しは、まだ始まっていない枠の時刻をずらし、`note` に根拠（公式告知の日時）を残す
- リトライは元の枠を残し、新しい `id` の枠を足す。キャンセルは枠を削除し、後ろの繰り上げは時刻の変更として直す
- 終了時刻を画面・画像に出すのは `end_source` が `explicit` のときだけ。推定の終了時刻は出さない
- 公式から取り込むのは事実（時刻・ステージ・出演者名・タイトル）だけ。概要文・写真・アイコン・公式画像は取り込まない
- データを直したら `pnpm validate` を通す

## ハマりどころ

- `wrangler.jsonc` の `compatibility_date` は、入っている wrangler（workerd）が対応する日付までしか上げられない。未来の日付にすると `pnpm dev` が `ERR_FUTURE_COMPATIBILITY_DATE` で落ちる
- `wrangler.jsonc` の `"previews": {}` は消さない。ないと main 以外のブランチのビルド（`wrangler preview`）が失敗する
- Node 26 には Corepack が入っていない。CI は `pnpm/setup` で pnpm と Node を入れている
- 依存を足したら `pnpm install` でロックファイルも更新してコミットする（CI は `--frozen-lockfile`）
- スキーマ（`schema/v1/event.ts`）を変えたら `pnpm schema` を実行して JSON Schema もコミットする。`event.schema.json` は Oxfmt の対象外
- 開発サーバーは、`events/` に新しいファイルを足したときは立ち上げ直す（既存ファイルの変更は自動で取り込む）
