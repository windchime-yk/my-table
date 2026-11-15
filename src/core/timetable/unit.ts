// 選べる単位。利用者がマイテーブルに入れる1件で、枠そのものか、ブロック（items のある枠）の中のトーク1本

import type { Day, Item, Slot, Stage } from "../../shared/event.ts";
import { formatMinutes, toMinutes } from "./time.ts";

/** 出演者名やステージ名を並べるときの区切り。中黒（・）は、端末のフォントによって太い黒丸に見えるので使わない */
export const NAME_SEPARATOR = " / ";

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
  /** 同時中継先のステージ（simulcast_in）。中継がなければ空 */
  relayStages: Stage[];
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
        relayStages: (slot.simulcast_in ?? []).flatMap((id) => day.stages.filter((s) => s.id === id)),
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

/** 表示用の名前。ブロックの中のトークはトークのタイトル、枠は枠の名前（なければ元の表記） */
export function unitTitle(unit: Pick<Unit, "slot" | "item">): string {
  return unit.item ? unit.item.title : (unit.slot.title ?? unit.slot.kind_label ?? "");
}

/**
 * いま進行中か。nowMinutes は、その日の 0:00 からの分（その日が「いま」でなければ null）。
 * 終了時刻が推定の枠も、判定には推定の終了時刻を使う（画面には出さない）
 */
export function isRunning(unit: Pick<Unit, "start" | "end">, nowMinutes: number | null): boolean {
  return nowMinutes !== null && unit.start <= nowMinutes && nowMinutes < unit.end;
}
