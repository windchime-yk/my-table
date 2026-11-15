/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { useEffect, useRef } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import { shortDate } from "../../shared/date.ts";
import type { Day } from "../../shared/event.ts";
import { pressed } from "../ui.ts";

/** 日数が多いときは横にスクロールする */
const dayChips = css`
  display: flex;
  gap: 16px;
  margin: 12px 0 4px;
  overflow-x: auto;
  scrollbar-width: none;
`;

/** 「タイムテーブル / マイテーブル」より軽く見えるよう、枠を付けず下線で選択を示す */
const dayChip = css`
  display: flex;
  flex: none;
  align-items: baseline;
  gap: 6px;
  padding: 6px 2px;
  border: 0;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--muted);
  font: inherit;
  font-size: 0.9rem;
  cursor: pointer;
`;

const dayChipOn = css`
  border-bottom-color: var(--accent);
  color: var(--ink);
  font-weight: 700;
`;

const dayChipLabel = css`
  font-size: 0.75rem;
`;

/** その日に選んでいる件数 */
const dayChipCount = css`
  min-width: 1.5em;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font-size: 0.7rem;
  font-weight: 700;
  text-align: center;
`;

/**
 * 日付の切り替え（複数日のイベント）。
 * 「タイムテーブル / マイテーブル」より上の階層なので上に置き、見た目は一段軽くする
 */
export const DayChips: FC<{
  days: Day[];
  dayIndex: number;
  /** 日ごとの選んだ件数 */
  counts: number[];
  onSelect: (index: number) => void;
}> = ({ days, dayIndex, counts, onSelect }) => {
  const navRef = useRef<HTMLElement>(null);

  // 選んだ日のチップが横スクロールの外にあれば、見える位置まで寄せる
  useEffect(() => {
    navRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [dayIndex]);

  return (
    <nav ref={navRef} class={dayChips} aria-label="日付">
      {days.map((day, i) => (
        <button
          type="button"
          class={cx(dayChip, i === dayIndex && dayChipOn)}
          aria-pressed={pressed(i === dayIndex)}
          onClick={() => onSelect(i)}
        >
          {day.label ? <span class={dayChipLabel}>{day.label}</span> : null}
          <span>{shortDate(day.date)}</span>
          {counts[i] > 0 ? <span class={dayChipCount}>{counts[i]}</span> : null}
        </button>
      ))}
    </nav>
  );
};
