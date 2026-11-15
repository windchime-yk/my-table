// 選べる単位。利用者がマイテーブルに入れる1件で、枠そのものか、ブロック（items のある枠）の中のトーク1本

import type { Day, Item, Slot, Stage } from "../shared/event.ts";
import { formatMinutes, toMinutes } from "./time.ts";

export interface Unit {
  /** 選択の保存に使う ID。枠の id か、トークの id */
  id: string;
  stage: Stage;
  /** 日の中でのステージの並び順（0 始まり） */
  stageIndex: number;
  slot: Slot;
  /** ブロックの中のトーク。枠そのものなら null */
  item: Item | null;
  /** ブロックの中での順番（1 始まり）と本数。枠そのものなら null */
  order: { index: number; total: number } | null;
  /** 開始・終了（その日の 0:00 からの分）。ブロックの中のトークは、枠の時刻をそのまま持つ */
  start: number;
  end: number;
  /** 終了時刻が公式に書かれているか。書かれていない終了時刻は画面に出さない */
  endExplicit: boolean;
}

/** 1日分の選べる単位を、開始時刻 → ステージの並び順 → ブロック内の順番で並べる */
export function unitsForDay(day: Day): Unit[] {
  const units = day.stages.flatMap((stage, stageIndex) =>
    stage.slots.flatMap((slot): Unit[] => {
      const base = {
        stage,
        stageIndex,
        slot,
        start: toMinutes(slot.start),
        end: toMinutes(slot.end),
        endExplicit: slot.end_source === "explicit",
      };
      const items = slot.items ?? [];
      if (items.length === 0) return [{ ...base, id: slot.id, item: null, order: null }];
      return items.map((item, i) => ({
        ...base,
        id: item.id,
        item,
        order: { index: i + 1, total: items.length },
      }));
    }),
  );
  return units.toSorted(
    (a, b) => a.start - b.start || a.stageIndex - b.stageIndex || (a.order?.index ?? 0) - (b.order?.index ?? 0),
  );
}

/** 表示用の時刻。終了時刻は公式に書かれているときだけ出す（推定を公式の時刻と誤認されないように） */
export function timeLabel(unit: Pick<Unit, "start" | "end" | "endExplicit">): string {
  const start = formatMinutes(unit.start);
  return unit.endExplicit ? `${start}–${formatMinutes(unit.end)}` : start;
}
