/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { css, cx } from "hono/jsx/dom/css";
import { stageColor } from "../../core/timetable/stage-color.ts";
import type { Day } from "../../shared/event.ts";
import { pressed, stageStyle } from "../ui.ts";

/** 数が多いときは横にスクロールする */
const chips = css`
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 4px;
  overflow-x: auto;
  scrollbar-width: none;
`;

const chip = css`
  flex: none;
  padding: 6px 12px;
  border: 1px solid var(--stage, var(--line));
  border-radius: 999px;
  background: var(--surface);
  color: inherit;
  font: inherit;
  font-size: 0.85rem;
  cursor: pointer;
`;

const chipOn = css`
  background: var(--stage, var(--ink));
  color: var(--bg);
  font-weight: 700;
`;

export const StageChips: FC<{ day: Day; stageId: string | null; onChange: (stageId: string | null) => void }> = ({
  day,
  stageId,
  onChange,
}) => (
  <div class={chips} role="group" aria-label="ステージで絞り込む">
    <button
      type="button"
      class={cx(chip, stageId === null && chipOn)}
      aria-pressed={pressed(stageId === null)}
      onClick={() => onChange(null)}
    >
      すべて
    </button>
    {day.stages.map((stage, i) => (
      <button
        type="button"
        class={cx(chip, stageId === stage.id && chipOn)}
        aria-pressed={pressed(stageId === stage.id)}
        style={stageStyle(stageColor(stage, i))}
        onClick={() => onChange(stage.id)}
      >
        {stage.name}
      </button>
    ))}
  </div>
);
