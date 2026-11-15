/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { useEffect, useMemo, useRef, useState } from "hono/jsx";
import { css } from "hono/jsx/dom/css";
import { currentDayDate, nowInZone, nowMinutesForDay, pickDayIndex } from "../core/timetable/day.ts";
import { buildExport, parseImport } from "../core/my-table/export-file.ts";
import { gridRange } from "../core/timetable/grid.ts";
import { listGroups } from "../core/timetable/list.ts";
import { findOverlaps } from "../core/my-table/overlap.ts";
import { reconcile, selectableIds, toggleSelected } from "../core/my-table/selection.ts";
import { unitsForDay } from "../core/timetable/unit.ts";
import { shortDate } from "../shared/date.ts";
import type { EventDoc } from "../shared/event.ts";
import { DayChips } from "./components/DayChips.tsx";
import { GridView } from "./components/GridView.tsx";
import { ImageDialog } from "./components/ImageDialog.tsx";
import { ListView } from "./components/ListView.tsx";
import { MineView } from "./components/MineView.tsx";
import { NoticeBar, SaveFailedNote } from "./components/Notices.tsx";
import { StageChips } from "./components/StageChips.tsx";
import { ViewTabs } from "./components/ViewTabs.tsx";
import { renderMyTable } from "./image.ts";
import { loadSelection, saveSelection } from "./storage.ts";
import type { CardContext, Notice, PreviewImage, View } from "./ui.ts";

/** 表示している日（表示名と日付） */
const dayLine = css`
  margin: 16px 0 8px;
  font-weight: 700;
`;

/** 「いまへ」。画面の右下に固定し、枠や上に固定した見出しより手前に出す（枠の下に隠れないように） */
const nowButton = css`
  position: fixed;
  right: 16px;
  bottom: calc(16px + env(safe-area-inset-bottom));
  z-index: 10;
  padding: 12px 18px;
  border: 0;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-ink);
  font: inherit;
  font-weight: 700;
  box-shadow: 0 4px 16px oklch(0% 0 0 / 0.35);
  cursor: pointer;
`;

/** 読み込むファイルの大きさの上限。書き出しファイルは数 KB なので、これより大きいものは別のファイルとみなす */
const MAX_IMPORT_BYTES = 1_000_000;

/** ブラウザにファイルとして保存させる */
function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // 保存が始まる前に URL を無効にしないよう、少し待ってから片付ける
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** この幅以上の画面では、ステージを列にした横並び表示にする */
const WIDE_QUERY = "(min-width: 720px)";

/** 開いたとき・戻る/進むのときに表示する日。URL の ?day= → 今日が開催日ならその日 → 初日 */
const dayIndexFromUrl = (doc: EventDoc): number =>
  pickDayIndex(
    doc.days,
    new URLSearchParams(location.search).get("day"),
    currentDayDate(doc.days, nowInZone(doc.event.timezone, new Date())),
  );

/**
 * 開いたときの選択。保存してあるものを今のデータに合わせる（初期化はせず、なくなった枠だけを外す）。
 * データが更新されていたら、合わせた結果を今のバージョンで保存し直す（次に開いたときに同じ知らせを出さないため）
 */
function openSelection(doc: EventDoc): { selected: string[]; notice: Notice | null; saveFailed: boolean } {
  const reconciled = reconcile(loadSelection(doc.id), doc.version, selectableIds(doc));
  const notice =
    reconciled.removed > 0
      ? { warn: true, text: `タイムテーブルが更新され、選んでいた${reconciled.removed}件が外れました。` }
      : null;
  const saveFailed =
    (reconciled.versionChanged || reconciled.removed > 0) && !saveSelection(doc.id, doc.version, reconciled.selected);
  return { selected: reconciled.selected, notice, saveFailed };
}

export const App: FC<{ doc: EventDoc }> = ({ doc }) => {
  // 開いたときに一度だけ、保存してある選択を読んで今のデータに合わせる
  const [initial] = useState(() => openSelection(doc));
  const [dayIndex, setDayIndex] = useState(() => dayIndexFromUrl(doc));
  const [view, setView] = useState<View>("all");
  /** 絞り込むステージ。null は「すべて」 */
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState(initial.selected);
  const [notice, setNotice] = useState(initial.notice);
  const [saveFailed, setSaveFailed] = useState(initial.saveFailed);
  /** 作った画像（プレビューのダイアログに出す）。なければ null */
  const [image, setImage] = useState<PreviewImage | null>(null);
  /** 読み込むファイルを選ばせる input（画面には出さない） */
  const fileRef = useRef<HTMLInputElement>(null);

  const [wide, setWide] = useState(() => window.matchMedia(WIDE_QUERY).matches);
  /** いまの時刻（分単位に切り捨てた、1970年からの分）。分が変わったときだけ描き直す */
  const [clock, setClock] = useState(() => Math.floor(Date.now() / 60_000));

  // 進行中の表示を1分ごとに更新する。画面を表示し直したとき（スマホのスリープ明けなど）もすぐ合わせる
  useEffect(() => {
    const tick = () => setClock(Math.floor(Date.now() / 60_000));
    const timer = setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  // 画面の幅が変わったら（端末の回転、ウィンドウの大きさの変更）、表示を切り替える
  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY);
    const onChange = () => setWide(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  // ブラウザの「戻る」「進む」で ?day= が変わったら、表示する日を合わせる
  useEffect(() => {
    const onPopState = () => setDayIndex(dayIndexFromUrl(doc));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [doc]);

  const day = doc.days[dayIndex];
  // ステージの ID は日ごとなので、切り替えた先の日にないステージの絞り込みは「すべて」に戻す
  const stageId = day.stages.some((stage) => stage.id === stageFilter) ? stageFilter : null;
  const groups = useMemo(() => listGroups(day, stageId), [day, stageId]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  /** 表示している日のマイテーブル（時刻順） */
  const mine = useMemo(() => unitsForDay(day).filter((unit) => selected.has(unit.id)), [day, selected]);
  const overlaps = useMemo(() => findOverlaps(mine), [mine]);
  // 時刻はすべてイベントのタイムゾーンで判定する（閲覧者の端末のタイムゾーンには左右されない）
  const nowMinutes = useMemo(
    () => nowMinutesForDay(day, nowInZone(doc.event.timezone, new Date(clock * 60_000))),
    [day, doc, clock],
  );
  /** 「いまへ」を出すか。タイムテーブルを表示していて、いまがその日の表示範囲に入っているとき */
  const range = useMemo(() => gridRange(day), [day]);
  const canJumpToNow =
    view === "all" && nowMinutes !== null && range !== null && range.from <= nowMinutes && nowMinutes <= range.to;
  /** 日ごとの選んだ件数。日付のチップに出す */
  const countByDay = useMemo(
    () => doc.days.map((d) => unitsForDay(d).filter((unit) => selected.has(unit.id)).length),
    [doc, selected],
  );

  /** 選択を入れ替えて保存する */
  const update = (next: string[]) => {
    setSelectedIds(next);
    setSaveFailed(!saveSelection(doc.id, doc.version, next));
  };
  const toggle = (id: string) => update(toggleSelected(selectedIds, id));

  /** 全日分の選択をファイルに書き出す */
  const exportFile = () => {
    const json = JSON.stringify(buildExport(doc, selectedIds, new Date()), null, 2);
    download(new Blob([json], { type: "application/json" }), `my-table-${doc.id}.json`);
  };

  /** 選ばれたファイルを読み込む。既存の選択とは混ぜずに上書きする */
  const importFile = async () => {
    const input = fileRef.current;
    const file = input?.files?.[0];
    // 同じファイルをもう一度選んでも読み込めるよう、選択を空に戻す
    if (input) input.value = "";
    if (!file) return;
    const unreadable = {
      warn: true,
      text: "このファイルは読み込めません。マイテーブルから書き出したファイルを選んでください。",
    };
    if (file.size > MAX_IMPORT_BYTES) return setNotice(unreadable);
    let text: string;
    try {
      text = await file.text();
    } catch {
      return setNotice(unreadable);
    }
    const result = parseImport(text, doc, selectableIds(doc));
    if (!result.ok) {
      if (result.reason === "invalid") return setNotice(unreadable);
      return setNotice({
        warn: true,
        text: `このファイルは別のイベント「${result.eventName ?? result.eventId}」のものです。読み込みませんでした。`,
      });
    }
    if (selectedIds.length > 0 && !confirm("今のマイテーブルを、ファイルの内容で上書きします。よろしいですか？")) {
      return;
    }
    update(result.selected);
    if (result.removed === 0) {
      setNotice({ warn: false, text: `${result.selected.length}件を読み込みました。` });
    } else if (result.versionChanged) {
      setNotice({
        warn: true,
        text: `読み込みました。タイムテーブルが更新されているため、${result.removed}件が外れました。`,
      });
    } else {
      setNotice({ warn: true, text: `読み込みました。見つからない枠が${result.removed}件あったため外しました。` });
    }
  };

  /** 表示している日のマイテーブルを画像にして、プレビューを出す */
  const saveImage = async () => {
    try {
      const blob = await renderMyTable({ doc, day, units: mine, overlaps });
      setImage({ url: URL.createObjectURL(blob), filename: `my-table-${doc.id}-${day.date}.png` });
    } catch {
      setNotice({ warn: true, text: "画像を作れませんでした。" });
    }
  };

  /** ダイアログが閉じたら、画像を片付ける */
  const closeImage = () => {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
  };

  const clearAll = () => {
    if (confirm("マイテーブルの選択を、すべての日の分まとめて解除します。よろしいですか？")) update([]);
  };
  const ctx: CardContext = { selected, overlaps, nowMinutes, toggle };

  const switchView = (next: View) => {
    setView(next);
    // 長いタイムテーブルの途中で切り替えても、切り替え先を先頭から見られるようにする
    window.scrollTo({ top: 0 });
  };

  /** 日付を切り替える。URL の ?day= も変え、ブラウザの「戻る」で前の日に戻れるようにする */
  const selectDay = (index: number) => {
    if (index === dayIndex) return;
    setDayIndex(index);
    const url = new URL(location.href);
    url.searchParams.set("day", doc.days[index].date);
    history.pushState(null, "", url);
  };

  /** 現在時刻の位置までスクロールする。リストでは「いま」を含む時刻のまとまり、横並びでは現在時刻の線 */
  const jumpToNow = () => {
    document.querySelector("[data-now]")?.scrollIntoView({ block: wide ? "center" : "start", behavior: "smooth" });
  };

  /** 横並び表示にするか。スマホ（狭い画面）とマイテーブルはリストのまま */
  const grid = wide && view === "all";

  return (
    <>
      {doc.days.length > 1 ? (
        <DayChips days={doc.days} dayIndex={dayIndex} counts={countByDay} onSelect={selectDay} />
      ) : (
        <p class={dayLine}>{[day.label, shortDate(day.date)].filter(Boolean).join(" · ")}</p>
      )}

      <ViewTabs view={view} mineCount={mine.length} pinned={!grid} onChange={switchView} />

      {notice ? <NoticeBar notice={notice} onClose={() => setNotice(null)} /> : null}
      {saveFailed ? <SaveFailedNote /> : null}

      {view === "mine" ? (
        <MineView
          doc={doc}
          units={mine}
          ctx={ctx}
          hasAnySelection={selectedIds.length > 0}
          onImage={() => {
            void saveImage();
          }}
          onExport={exportFile}
          onImport={() => fileRef.current?.click()}
          onClear={clearAll}
        />
      ) : (
        <>
          <StageChips day={day} stageId={stageId} onChange={setStageFilter} />
          {grid ? (
            <GridView doc={doc} day={day} stageId={stageId} ctx={ctx} />
          ) : (
            <ListView doc={doc} day={day} groups={groups} ctx={ctx} />
          )}
        </>
      )}

      {canJumpToNow ? (
        <button type="button" class={nowButton} onClick={jumpToNow}>
          いまへ
        </button>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={() => {
          void importFile();
        }}
      />

      {image ? <ImageDialog image={image} onClose={closeImage} /> : null}
    </>
  );
};
