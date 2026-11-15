// 選択の読み書き。localStorage は使えない・消えることがある前提で、失敗しても落ちないようにする
// （プライベートブラウズや、サイトデータを保存しない設定では、触るだけで例外になることがある）

import { buildStored, parseStored, storageKey, type Stored } from "../domain/selection.ts";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** localStorage を取り出す。取り出すだけで例外になる環境があるので、呼ぶ側の try の中で使う */
const browserStorage = (): StorageLike => localStorage;

/** 保存してある選択を読む。保存がない・読めないときは null */
export function loadSelection(eventId: string, getStorage: () => StorageLike = browserStorage): Stored | null {
  try {
    return parseStored(getStorage().getItem(storageKey(eventId)));
  } catch {
    return null;
  }
}

/** 選択を保存する。保存できたら true、できなかったら false */
export function saveSelection(
  eventId: string,
  version: string,
  selected: string[],
  getStorage: () => StorageLike = browserStorage,
): boolean {
  try {
    getStorage().setItem(storageKey(eventId), JSON.stringify(buildStored(version, selected, new Date())));
    return true;
  } catch {
    return false;
  }
}
