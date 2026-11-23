import { css, cx } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";
import type { EventDoc } from "../shared/event.ts";
import { APP_ELEMENT_ID, PAYLOAD_ELEMENT_ID, type EventPayload } from "../shared/payload.ts";
import { safeJson } from "../shared/safe-json.ts";
import { empty, lead, title, wrap } from "../styles.ts";

/**
 * イベントページの幅と余白。wrap のあとに組み合わせる。
 * 見出しまでの余白は TOP より詰める（スマホで枠が早く見えるように）。
 * 広い画面では、ステージを列にした横並び表示が入る幅にする（ブラウザ側の WIDE_QUERY と合わせる）
 */
const eventMain = css`
  padding-block: 20px 56px;

  @media (min-width: 720px) {
    max-width: 1200px;
  }
`;

const backLink = css`
  margin: 0 0 12px;
  color: var(--muted);
  font-size: 0.85rem;
`;

const eventAbout = css`
  margin-top: 40px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.85rem;

  & p {
    margin: 0 0 8px;
  }
`;

/** リンクにしてよい URL か。データの書き間違いで `javascript:` などがリンクにならないようにする */
const isHttpUrl = (url: string): boolean => /^https?:\/\//.test(url);

/** 公式サイトへのリンク・取り込み元・公式の注意書き・非公式である旨。JavaScript が動かなくても読めるようサーバーで出す */
const About: FC<{ doc: EventDoc }> = ({ doc }) => {
  const { official_url: officialUrl, sources, notice } = doc.event;
  return (
    <section class={eventAbout} aria-label="このタイムテーブルについて">
      <p>
        非公式のマイテーブルです。イベントの主催者・出演者とは関係ありません。最新・正確な情報は
        {officialUrl && isHttpUrl(officialUrl) ? (
          <a href={officialUrl} target="_blank" rel="noopener noreferrer">
            公式サイト
          </a>
        ) : (
          "公式の情報"
        )}
        で確認してください。
      </p>
      {notice ? <p>公式の注意書き: {notice}</p> : null}
      {sources && sources.length > 0 ? <p>取り込み元: {sources.join(" / ")}</p> : null}
    </section>
  );
};

/**
 * イベントページ。タイムテーブルはブラウザ側（src/client/）が描くので、
 * サーバーは枠組みと、初期データを埋め込んだ script 要素を返す
 */
export const EventPage: FC<{ doc: EventDoc; clientScript: string; devClientScript?: string }> = ({
  doc,
  clientScript,
  devClientScript,
}) => {
  const payload: EventPayload = { doc };
  return (
    <Layout title={doc.event.name} devClientScript={devClientScript}>
      <main class={cx(wrap, eventMain)}>
        <p class={backLink}>
          <a href="/">← イベント一覧</a>
        </p>
        <h1 class={title}>{doc.event.name}</h1>
        {doc.event.venue ? <p class={lead}>{doc.event.venue}</p> : null}
        <div id={APP_ELEMENT_ID}>
          <p class={empty}>読み込み中…</p>
        </div>
        <noscript>
          <p class={empty}>タイムテーブルの表示には JavaScript が必要です。</p>
        </noscript>
        <About doc={doc} />
      </main>
      <script type="application/json" id={PAYLOAD_ELEMENT_ID} dangerouslySetInnerHTML={{ __html: safeJson(payload) }} />
      <script type="module" src={clientScript} />
    </Layout>
  );
};
