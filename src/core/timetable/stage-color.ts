import type { Stage } from "../../shared/event.ts";

/** データに色がないステージへ、並び順で割り当てる既定の色（OKLCH） */
export const DEFAULT_STAGE_COLORS = [
  "oklch(83.5% 0.21 130)",
  "oklch(72% 0.14 275)",
  "oklch(82% 0.15 75)",
  "oklch(72% 0.19 5)",
  "oklch(78% 0.12 190)",
  "oklch(75% 0.16 305)",
];

/** ステージの表示色。データの color があればそれ、なければ既定の色を並び順で割り当てる（足りなければ先頭に戻る） */
export function stageColor(stage: Pick<Stage, "color">, stageIndex: number): string {
  return stage.color ?? DEFAULT_STAGE_COLORS[stageIndex % DEFAULT_STAGE_COLORS.length];
}
