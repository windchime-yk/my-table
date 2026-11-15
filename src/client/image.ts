// マイテーブルを1枚の画像（PNG）にする。当日、電波が悪くても見られる控え用

import type { Overlap } from "../domain/overlap.ts";
import { stageColor } from "../domain/stage-color.ts";
import { formatMinutes } from "../domain/time.ts";
import { NAME_SEPARATOR, unitTitle, type Unit } from "../domain/unit.ts";
import { wrapText } from "../domain/wrap-text.ts";
import { shortDate } from "../shared/date.ts";
import type { Day, EventDoc } from "../shared/event.ts";

const FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",system-ui,sans-serif';

/** 画像の幅（px）。スマホの写真アプリで拡大せずに読める大きさにする */
const WIDTH = 1080;
const PAD = 64;
/** カードの左端・右端 */
const CARD_X = PAD - 24;
const CARD_W = WIDTH - CARD_X * 2;
const CARD_RADIUS = 20;
/** カード左の、ステージ色の帯の幅 */
const STRIPE_W = 10;
/** タイトルなどの文字の左端。ここより左を時刻の列にする */
const TEXT_X = 268;
const TEXT_W = WIDTH - TEXT_X - PAD;
const HEADER_H = 200;
const FOOTER_H = 120;
const ROW_GAP = 16;

/** テーマの色。画面と同じ CSS 変数（OKLCH。src/styles.ts で定義）を読んで使う */
const THEME = {
  bg: "--bg",
  surface: "--surface",
  ink: "--ink",
  muted: "--muted",
  line: "--line",
  warn: "--warn",
} as const;

type ThemeColor = keyof typeof THEME;

export interface ImageInput {
  doc: EventDoc;
  /** 画像にする日 */
  day: Day;
  /** その日に選んだ単位（時刻順） */
  units: Unit[];
  overlaps: Map<string, Overlap[]>;
}

/** 1件分の、描く内容と高さ */
interface Row {
  unit: Unit;
  title: string[];
  sub: string | null;
  flags: string | null;
  height: number;
}

export function renderMyTable({ doc, day, units, overlaps }: ImageInput): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.reject(new Error("canvas を使えません"));

  const rootStyle = getComputedStyle(document.documentElement);
  /** 塗りの色を、テーマの色にする */
  const fillTheme = (key: ThemeColor) => {
    ctx.fillStyle = rootStyle.getPropertyValue(THEME[key]).trim();
  };
  const font = (weight: number, size: number) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
  };
  const measure = (text: string) => ctx.measureText(text).width;
  /** 1行に収め、収まらなければ省略記号で詰める */
  const oneLine = (text: string, width: number) => wrapText(text, width, 1, measure)[0] ?? "";

  // 先に各行の折り返しと高さを決め、画像の高さを出してから描く（canvas は大きさを変えると描いた内容が消える）
  const rows: Row[] = units.map((unit) => {
    const { slot, item, order } = unit;
    font(700, 38);
    const title = wrapText(unitTitle(unit), TEXT_W, 2, measure);
    const speakers = item ? item.speakers : slot.speakers;
    const subParts = [
      [slot.kind_label, order ? `${order.index}/${order.total}本目` : null].filter(Boolean).join(" "),
      item ? null : slot.subtitle,
      slot.note,
      unit.relayStages.length > 0
        ? `同時中継: ${unit.relayStages.map((stage) => stage.name).join(NAME_SEPARATOR)}`
        : null,
      speakers?.join(NAME_SEPARATOR),
    ].filter(Boolean);
    const flagParts = (slot.tags ?? []).map((tag) => doc.tag_definitions?.[tag] ?? tag);
    const unitOverlaps = overlaps.get(unit.id) ?? [];
    if (unitOverlaps.length > 0) {
      const label = unitOverlaps.some((overlap) => overlap.certain)
        ? "時間が重なっています"
        : "重なっている可能性があります";
      flagParts.push(`${label}: ${unitOverlaps.map((overlap) => unitTitle(overlap.other)).join("、")}`);
    }
    const sub = subParts.length > 0 ? subParts.join(" · ") : null;
    const flags = flagParts.length > 0 ? flagParts.join(" · ") : null;
    const textHeight = 28 + 30 + title.length * 50 + (sub ? 38 : 0) + (flags ? 38 : 0) + 24;
    // 終了時刻を出す行は、時刻の列が2段（開始・終了）になる分の高さを確保する
    return { unit, title, sub, flags, height: Math.max(textHeight, unit.endExplicit ? 160 : 0) };
  });

  const bodyHeight = rows.length > 0 ? rows.reduce((sum, row) => sum + row.height + ROW_GAP, 0) : 120;
  canvas.width = WIDTH;
  canvas.height = HEADER_H + bodyHeight + FOOTER_H;

  fillTheme("bg");
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // 見出し: イベント名、日付と件数
  fillTheme("ink");
  font(700, 44);
  ctx.fillText(oneLine(doc.event.name, WIDTH - PAD * 2), PAD, 96);
  fillTheme("muted");
  font(500, 30);
  const dayText = [day.label, shortDate(day.date), `マイテーブル ${units.length}件`].filter(Boolean).join("  ·  ");
  ctx.fillText(oneLine(dayText, WIDTH - PAD * 2), PAD, 148);

  let y = HEADER_H;
  if (rows.length === 0) {
    fillTheme("muted");
    font(500, 32);
    ctx.fillText("まだ何も選んでいません", PAD, y + 60);
  }

  // 時刻の列は、色の帯の右端からタイトルの手前まで。開始・終了ともその中央にそろえる
  const timeLeft = CARD_X + STRIPE_W;
  const timeRight = TEXT_X - 24;
  const timeCenter = (timeLeft + timeRight) / 2;
  const timeWidth = timeRight - timeLeft - 16;

  for (const row of rows) {
    const { unit } = row;
    const color = stageColor(unit.stage, unit.stageIndex);

    // カードの角丸で切り抜いてから、地の色とステージ色の帯を塗る。
    // 帯を別の四角形として重ねると、カードの丸い角から帯の角がはみ出す
    ctx.save();
    roundRect(ctx, CARD_X, y, CARD_W, row.height, CARD_RADIUS);
    ctx.clip();
    fillTheme("surface");
    ctx.fillRect(CARD_X, y, CARD_W, row.height);
    ctx.fillStyle = color;
    ctx.fillRect(CARD_X, y, STRIPE_W, row.height);
    ctx.restore();

    let textY = y + 28 + 26;

    // 開始時刻を大きく、終了時刻（公式に書かれているときだけ）をその下に小さく描く。
    // 最大幅を渡して、はみ出すときは縮めて収める
    ctx.textAlign = "center";
    fillTheme("ink");
    font(700, 40);
    ctx.fillText(formatMinutes(unit.start), timeCenter, textY + 34, timeWidth);
    if (unit.endExplicit) {
      fillTheme("muted");
      font(600, 28);
      ctx.fillText(`〜${formatMinutes(unit.end)}`, timeCenter, textY + 34 + 42, timeWidth);
    }
    ctx.textAlign = "left";

    ctx.fillStyle = color;
    font(700, 26);
    ctx.fillText(oneLine(unit.stage.name, TEXT_W), TEXT_X, textY);
    textY += 8;
    fillTheme("ink");
    font(700, 38);
    for (const line of row.title) {
      textY += 50;
      ctx.fillText(line, TEXT_X, textY);
    }
    if (row.sub) {
      textY += 38;
      fillTheme("muted");
      font(500, 26);
      ctx.fillText(oneLine(row.sub, TEXT_W), TEXT_X, textY);
    }
    if (row.flags) {
      textY += 38;
      fillTheme("warn");
      font(600, 26);
      ctx.fillText(oneLine(row.flags, TEXT_W), TEXT_X, textY);
    }
    y += row.height + ROW_GAP;
  }

  // 下部: 区切りの線と、非公式である旨
  fillTheme("line");
  ctx.fillRect(PAD, y + 23, WIDTH - PAD * 2, 2);
  fillTheme("muted");
  font(500, 24);
  ctx.fillText("非公式のマイテーブルです。最新・正確な情報は公式で確認してください。", PAD, y + 72, WIDTH - PAD * 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("画像を作れませんでした"));
    }, "image/png");
  });
}

/** 角の丸い四角形のパスを作る */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
