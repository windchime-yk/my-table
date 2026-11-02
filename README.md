# my-table

フェスやカンファレンスのタイムテーブルから、見たい枠を選んで自分だけのマイテーブルを作る非公式ツール。

https://mt.whyk.dev

- ログインなし。選んだ枠はブラウザにだけ保存し、サーバーには送らない
- Cloudflare Workers 上の Hono で動かし、Vite と Cloudflare の Vite プラグインでビルドする

設計とデータの流れは [docs/SPEC.md](docs/SPEC.md) を参照。

## 手元で動かす

Node は `.node-version` のバージョンを使う。

```sh
pnpm install
pnpm dev
```

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `pnpm dev` | 開発サーバー（Worker を本番に近い環境で動かす） |
| `pnpm build` | ビルド |
| `pnpm preview` | ビルドして、ビルド結果を手元で確認する |
| `pnpm lint` / `pnpm lint:fix` | Oxlint による lint（型チェックを含む） / 自動修正 |
| `pnpm fmt` / `pnpm fmt:check` | Oxfmt による整形 / 整形のチェック |
| `pnpm test` | Vitest によるテスト |
| `pnpm deploy` | ビルドして手元から直接デプロイする |

## デプロイ

Cloudflare の Workers Builds が、main への push をきっかけにビルドしてデプロイする。デプロイの経路を2つにすると互いに上書きし合うので、ほかの方法と併用しない。

Workers Builds の設定（Cloudflare ダッシュボードの Worker の設定 → ビルド で、このリポジトリを接続する）:

| 項目 | 値 |
| --- | --- |
| ビルドコマンド | `pnpm test && pnpm build` |
| デプロイコマンド | `pnpm wrangler deploy` |

フォークして使う場合は、自分の Cloudflare アカウントの Workers Builds にリポジトリを接続する。Worker 名は `wrangler.jsonc` の `name` で変えられる。

## ライセンス

コードは [MIT](LICENSE)。
