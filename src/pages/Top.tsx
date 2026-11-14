import { cx } from "hono/css";
import type { FC } from "hono/jsx";
import { Layout } from "../components/Layout.tsx";
import { formatDateRange } from "../shared/date.ts";
import type { EventSummary } from "../shared/event.ts";
import {
  empty,
  eventCard,
  eventDates,
  eventList,
  eventName,
  heading,
  lead,
  main,
  notes,
  section,
  step,
  steps,
  title,
  wrap,
} from "../styles.ts";

export const Top: FC<{ events: EventSummary[] }> = ({ events }) => (
  <Layout>
    <main class={cx(wrap, main)}>
      <h1 class={title}>マイテーブル</h1>
      <p class={lead}>
        フェスやカンファレンスのタイムテーブルから、見たい枠を選んで自分だけのタイムテーブルを作るツールです。
      </p>

      <section class={section}>
        <h2 class={heading}>イベント</h2>
        {events.length > 0 ? (
          <ul class={eventList}>
            {events.map((e) => (
              <li>
                <a class={eventCard} href={`/e/${e.id}`}>
                  <span class={eventName}>{e.name}</span>
                  <span class={eventDates}>{formatDateRange(e.dates)}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p class={empty}>公開中のイベントはまだありません。</p>
        )}
      </section>

      <section class={section}>
        <h2 class={heading}>使い方</h2>
        <ol class={steps}>
          <li class={step}>イベントを選ぶ</li>
          <li class={step}>タイムテーブルで、見たい枠を選ぶ</li>
          <li class={step}>マイテーブルで確認する。当日は画像で保存しておくと、電波が弱い会場でも見られます</li>
        </ol>
      </section>

      <section class={section}>
        <h2 class={heading}>ご注意</h2>
        <ul class={notes}>
          <li>非公式のツールです。イベントの主催者・出演者とは関係ありません。</li>
          <li>
            タイムテーブルは公式の情報をもとにしていますが、最新・正確な情報は各イベントの公式で確認してください。
          </li>
          <li>選んだ枠はこのブラウザにだけ保存され、サーバーには送信しません。</li>
        </ul>
      </section>
    </main>
  </Layout>
);
