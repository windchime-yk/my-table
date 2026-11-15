// ブラウザ側の画面で共通に使う型と、小さな関数

import type { Overlap } from "../core/my-table/overlap.ts";

/** all: タイムテーブル / mine: マイテーブル */
export type View = "all" | "mine";

/** 枠のカードを描くのに使うもの。選んでいる ID、重なり、いまの時刻、選ぶ・外すの切り替え */
export interface CardContext {
  selected: Set<string>;
  /** 表示している日の、選んだ単位どうしの時間の重なり（単位の ID ごと） */
  overlaps: Map<string, Overlap[]>;
  /** いまの時刻（表示している日の 0:00 からの分）。表示している日が「いま」でなければ null */
  nowMinutes: number | null;
  toggle: (id: string) => void;
}

/** 画面の上に出す知らせ。warn は注意（外れた枠がある、読み込めなかった）、そうでなければ結果の報告 */
export interface Notice {
  warn: boolean;
  text: string;
}

/** 作った画像（プレビューに出すもの） */
export interface PreviewImage {
  url: string;
  filename: string;
}

/** ステージの色を、子孫の要素が使う CSS 変数として渡す */
export const stageStyle = (color: string) => `--stage:${color}`;

/** aria-pressed に渡す値 */
export const pressed = (on: boolean) => (on ? "true" : "false");
