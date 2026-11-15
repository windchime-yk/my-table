// 選んだ単位どうしの時間の重なり

import type { Unit } from "../timetable/unit.ts";

export interface Overlap {
  /** 重なっている相手 */
  other: Unit;
  /** true は確実な重なり。false は、推定の終了時刻に基づく「重なる可能性あり」 */
  certain: boolean;
}

/**
 * 同じ日に選んだ単位どうしの重なりを、単位の ID ごとに求める。重なりがない単位は結果に入れない。
 * - 確実に重なるのは、開始が同じか、先に始まる側の終了時刻が公式に書いてある場合。
 *   推定の終了時刻で重なって見えるだけのときは「可能性あり」にする
 * - 同じブロックの中のトークどうしは、順に行われるので重なりとみなさない
 * - 同時中継は枠が1つなので、自然に対象外になる
 */
export function findOverlaps(units: Unit[]): Map<string, Overlap[]> {
  const result = new Map<string, Overlap[]>();
  const add = (id: string, overlap: Overlap) => {
    const list = result.get(id);
    if (list) list.push(overlap);
    else result.set(id, [overlap]);
  };
  for (const [i, a] of units.entries()) {
    for (const b of units.slice(i + 1)) {
      if (a.slot === b.slot) continue;
      if (!(a.start < b.end && b.start < a.end)) continue;
      const [first, second] = a.start <= b.start ? [a, b] : [b, a];
      const certain = first.start === second.start || (first.endExplicit && first.end > second.start);
      add(a.id, { other: b, certain });
      add(b.id, { other: a, certain });
    }
  }
  return result;
}
