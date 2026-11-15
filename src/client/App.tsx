/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { useEffect, useMemo, useRef, useState } from "hono/jsx";
import { cx } from "hono/jsx/dom/css";
import { currentDayDate, nowInZone, nowMinutesForDay, pickDayIndex } from "../domain/day.ts";
import { buildExport, parseImport } from "../domain/export-file.ts";
import {
  gridBox,
  gridHeight,
  gridOffset,
  gridRange,
  gridTicks,
  PX_PER_MINUTE,
  rowsByStage,
  TICK_MINUTES,
} from "../domain/grid.ts";
import { listGroups, type ListGroup, type ListRow } from "../domain/list.ts";
import { findOverlaps, type Overlap } from "../domain/overlap.ts";
import { selectableIds, toggleSelected } from "../domain/ctx.ts";
import { stageColor } from "../domain/stage-color.ts";
import { formatMinutes, toMinutes } from "../domain/time.ts";
import { isRunning, NAME_SEPARATOR, timeLabel, unitsForDay, unitTitle, type Unit } from "../domain/unit.ts";
import { shortDate } from "../shared/date.ts";
import type { Day, DayEvent, EventDoc } from "../shared/event.ts";
import { renderMyTable } from "./image.ts";
import { saveSelection } from "./storage.ts";
import * as s from "./styles.ts";

/** all: タイムテーブル / mine: マイテーブル */
type View = "all" | "mine";

/** 枠のカードを描くのに使うもの。選んでいる ID、重なり、いまの時刻、選ぶ・外すの切り替え */
interface CardContext {
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

/** ステージの色を、子孫の要素が使う CSS 変数として渡す */
const stageStyle = (color: string) => `--stage:${color}`;

const pressed = (on: boolean) => (on ? "true" : "false");

/** 開いたとき・戻る/進むのときに表示する日。URL の ?day= → 今日が開催日ならその日 → 初日 */
const dayIndexFromUrl = (doc: EventDoc): number =>
  pickDayIndex(
    doc.days,
    new URLSearchParams(location.search).get("day"),
    currentDayDate(doc.days, nowInZone(doc.event.timezone, new Date())),
  );

export interface AppProps {
  doc: EventDoc;
  /** 開いたときの選択（保存してあったものを、今のデータに合わせたもの） */
  initialSelected: string[];
  /** 開いたときに出す知らせ（データの更新で外れた枠があったとき）。なければ null */
  initialNotice: Notice | null;
  /** 開いたときの保存し直しに失敗したか */
  initialSaveFailed: boolean;
}

export const App: FC<AppProps> = ({ doc, initialSelected, initialNotice, initialSaveFailed }) => {
  const [dayIndex, setDayIndex] = useState(() => dayIndexFromUrl(doc));
  const [view, setView] = useState<View>("all");
  /** 絞り込むステージ。null は「すべて」 */
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState(initialSelected);
  const [notice, setNotice] = useState(initialNotice);
  const [saveFailed, setSaveFailed] = useState(initialSaveFailed);

  const [wide, setWide] = useState(() => window.matchMedia(WIDE_QUERY).matches);
  /** いまの時刻（分単位に切り捨てた、1970年からの分）。分が変わったときだけ描き直す */
  const [clock, setClock] = useState(() => Math.floor(Date.now() / 60_000));
  const dayNavRef = useRef<HTMLElement>(null);

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
  const fileRef = useRef<HTMLInputElement>(null);
  /** 作った画像（プレビューのダイアログに出す）。なければ null */
  const [image, setImage] = useState<{ url: string; filename: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // 画像ができたら、プレビューのダイアログを開く
  useEffect(() => {
    if (image) dialogRef.current?.showModal();
  }, [image]);

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

  // 選んだ日のチップが横スクロールの外にあれば、見える位置まで寄せる
  useEffect(() => {
    dayNavRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [dayIndex]);

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
        // 「タイムテーブル / マイテーブル」より上の階層なので上に置き、見た目は一段軽くする
        <nav ref={dayNavRef} class={s.dayChips} aria-label="日付">
          {doc.days.map((d, i) => (
            <button
              type="button"
              class={cx(s.dayChip, i === dayIndex && s.dayChipOn)}
              aria-pressed={pressed(i === dayIndex)}
              onClick={() => selectDay(i)}
            >
              {d.label ? <span class={s.dayChipLabel}>{d.label}</span> : null}
              <span>{shortDate(d.date)}</span>
              {countByDay[i] > 0 ? <span class={s.dayChipCount}>{countByDay[i]}</span> : null}
            </button>
          ))}
        </nav>
      ) : (
        <p class={s.dayLine}>{[day.label, shortDate(day.date)].filter(Boolean).join(" · ")}</p>
      )}

      {/* 横並び表示ではステージの見出しを上に固定するので、表示の切り替えは固定しない */}
      <nav class={cx(s.views, grid && s.viewsStatic)} aria-label="表示">
        <button
          type="button"
          class={cx(s.tab, view === "all" && s.tabOn)}
          aria-pressed={pressed(view === "all")}
          onClick={() => switchView("all")}
        >
          タイムテーブル
        </button>
        <button
          type="button"
          class={cx(s.tab, view === "mine" && s.tabOn)}
          aria-pressed={pressed(view === "mine")}
          onClick={() => switchView("mine")}
        >
          マイテーブル <span class={s.count}>{mine.length}</span>
        </button>
      </nav>

      {notice ? (
        <p class={cx(s.warning, s.notice, notice.warn && s.noticeWarn)} role="status">
          {notice.text}
          <button type="button" class={s.noticeClose} aria-label="閉じる" onClick={() => setNotice(null)}>
            ×
          </button>
        </p>
      ) : null}
      {saveFailed ? (
        <p class={s.warning} role="status">
          このブラウザでは選択を保存できませんでした（プライベートブラウズなど）。ページを閉じると選択は消えます。マイテーブルの「ファイルに書き出す」で控えを取れます。
        </p>
      ) : null}

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
        <button type="button" class={s.nowButton} onClick={jumpToNow}>
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

      {image ? (
        <dialog ref={dialogRef} class={s.dialog} onClose={closeImage}>
          <p class={s.dialogText}>スマホでは、画像を長押しすると写真に保存できます。</p>
          <img class={s.dialogImage} src={image.url} alt="マイテーブルの画像" />
          <div class={s.actions}>
            <a class={cx(s.action, s.actionPrimary)} href={image.url} download={image.filename}>
              ダウンロード
            </a>
            <button type="button" class={s.action} onClick={() => dialogRef.current?.close()}>
              閉じる
            </button>
          </div>
        </dialog>
      ) : null}
    </>
  );
};

// ---------- ステージの絞り込み ----------

const StageChips: FC<{ day: Day; stageId: string | null; onChange: (stageId: string | null) => void }> = ({
  day,
  stageId,
  onChange,
}) => (
  <div class={s.chips} role="group" aria-label="ステージで絞り込む">
    <button
      type="button"
      class={cx(s.chip, stageId === null && s.chipOn)}
      aria-pressed={pressed(stageId === null)}
      onClick={() => onChange(null)}
    >
      すべて
    </button>
    {day.stages.map((stage, i) => (
      <button
        type="button"
        class={cx(s.chip, stageId === stage.id && s.chipOn)}
        aria-pressed={pressed(stageId === stage.id)}
        style={stageStyle(stageColor(stage, i))}
        onClick={() => onChange(stage.id)}
      >
        {stage.name}
      </button>
    ))}
  </div>
);

// ---------- タイムテーブル（リスト） ----------

/** 「いまへ」の行き先にする、時刻のまとまりの開始時刻。いま以前で最後に始まったまとまり（なければ最初のまとまり） */
function nowGroupStart(groups: ListGroup[], nowMinutes: number | null): number | null {
  if (nowMinutes === null) return null;
  const started = groups.filter((group) => group.start <= nowMinutes);
  return (started.at(-1) ?? groups[0])?.start ?? null;
}

const ListView: FC<{ doc: EventDoc; day: Day; groups: ListGroup[]; ctx: CardContext }> = ({ doc, day, groups, ctx }) =>
  groups.length > 0 ? (
    <div>
      {groups.map((group) => (
        <section class={s.group} data-now={group.start === nowGroupStart(groups, ctx.nowMinutes) ? "true" : undefined}>
          <h2 class={s.groupTime}>{formatMinutes(group.start)}</h2>
          {group.dayEvents.map((dayEvent) => (
            <DayEventRow day={day} dayEvent={dayEvent} />
          ))}
          {group.rows.map((row) =>
            row.slot.items ? (
              <BlockCard doc={doc} row={row} ctx={ctx} />
            ) : (
              row.units.map((unit) => <UnitCard doc={doc} unit={unit} ctx={ctx} />)
            ),
          )}
        </section>
      ))}
    </div>
  ) : (
    <p class={s.empty}>この日の枠はまだありません。</p>
  );

/** 開場・休憩など */
const DayEventRow: FC<{ day: Day; dayEvent: DayEvent }> = ({ day, dayEvent }) => {
  const where = dayEvent.stages?.length
    ? dayEvent.stages.map((id) => day.stages.find((stage) => stage.id === id)?.name ?? id).join(NAME_SEPARATOR)
    : "全体";
  return (
    <p class={s.dayEvent}>
      <span>{dayEvent.title}</span>
      <span class={s.muted}>
        {where}
        {dayEvent.end ? ` · 〜${dayEvent.end}` : ""}
      </span>
    </p>
  );
};

// ---------- 選べる単位 ----------

/** タグの表示名を並べる。定義がないキーはそのまま出す */
const Tags: FC<{ doc: EventDoc; tags: string[] | undefined }> = ({ doc, tags }) =>
  tags && tags.length > 0 ? (
    <span class={s.flags}>
      {tags.map((tag) => (
        <span class={s.flag}>{doc.tag_definitions?.[tag] ?? tag}</span>
      ))}
    </span>
  ) : null;

/**
 * 時間の重なりの知らせ。重なる単位も選べるままにし、相手が分かるよう名前を添える。
 * 確実な重なりと、推定の終了時刻による「可能性あり」は分けて出す
 */
const OverlapFlags: FC<{ overlaps: Overlap[] | undefined }> = ({ overlaps }) => {
  if (!overlaps || overlaps.length === 0) return null;
  const names = (certain: boolean) =>
    overlaps
      .filter((overlap) => overlap.certain === certain)
      .map((overlap) => unitTitle(overlap.other))
      .join("、");
  const certain = names(true);
  const possible = names(false);
  return (
    <span class={s.flags}>
      {certain ? <span class={cx(s.flag, s.flagWarn)}>時間が重なっています: {certain}</span> : null}
      {possible ? <span class={cx(s.flag, s.flagWarn)}>重なっている可能性があります: {possible}</span> : null}
    </span>
  );
};

/** 進行中の印 */
const Live: FC = () => <span class={s.live}>進行中</span>;

/** 選んでいるかの印 */
const Check: FC<{ on: boolean }> = ({ on }) => (
  <span class={cx(s.check, on && s.checkOn)} aria-hidden="true">
    {on ? "✓" : "+"}
  </span>
);

/**
 * 選べる単位1つのカード。タップで選ぶ・外す。
 * ブロックの中のトークも、マイテーブルではこのカードで出す（何本目かを添える）
 */
const UnitCard: FC<{ doc: EventDoc; unit: Unit; ctx: CardContext }> = ({ doc, unit, ctx }) => {
  const { slot, item, order } = unit;
  const on = ctx.selected.has(unit.id);
  const running = isRunning(unit, ctx.nowMinutes);
  const kind = [slot.kind_label, order ? `${order.index}/${order.total}本目` : null].filter(Boolean).join(" · ");
  const speakers = item ? item.speakers : slot.speakers;
  const sub = [item ? null : slot.subtitle, slot.note, speakers?.join(NAME_SEPARATOR)].filter(Boolean);
  return (
    <button
      type="button"
      class={cx(s.card, s.cardButton, on && s.cardOn, running && s.cardLive)}
      aria-pressed={pressed(on)}
      style={stageStyle(stageColor(unit.stage, unit.stageIndex))}
      onClick={() => ctx.toggle(unit.id)}
    >
      <span class={s.cardHead}>
        <span class={s.cardTime}>{timeLabel(unit)}</span>
        {running ? <Live /> : null}
        <span class={s.cardStage}>{unit.stage.name}</span>
        {kind ? <span class={s.muted}>{kind}</span> : null}
      </span>
      <span class={s.cardTitle}>{unitTitle(unit)}</span>
      {sub.length > 0 ? <span class={s.cardSub}>{sub.join(" · ")}</span> : null}
      <Tags doc={doc} tags={slot.tags} />
      <OverlapFlags overlaps={ctx.overlaps.get(unit.id)} />
      <Check on={on} />
    </button>
  );
};

/** ブロック。1つの枠に、個別の開始時刻なしで複数のトークが入っている。トーク1本ずつを選ぶ */
const BlockCard: FC<{ doc: EventDoc; row: ListRow; ctx: CardContext }> = ({ doc, row, ctx }) => {
  const { slot, units } = row;
  const first = units[0];
  // ブロックの中のトークには個別の時刻がないので、進行中かは枠の時間で判定する
  const running = isRunning(first, ctx.nowMinutes);
  const heading = [slot.title, slot.kind_label].filter(Boolean).join(" · ");
  return (
    <div
      class={cx(s.card, s.block, running && s.cardLive)}
      style={stageStyle(stageColor(first.stage, first.stageIndex))}
    >
      <span class={s.cardHead}>
        <span class={s.cardTime}>{timeLabel(first)}</span>
        {running ? <Live /> : null}
        <span class={s.cardStage}>{first.stage.name}</span>
        {heading ? <span class={s.muted}>{heading}</span> : null}
      </span>
      <span class={s.blockNote}>各トークの開始時刻は公開されていません。順番のみ表示しています。</span>
      {slot.note ? <span class={s.cardSub}>{slot.note}</span> : null}
      <Tags doc={doc} tags={slot.tags} />
      {units.map((unit) => {
        const on = ctx.selected.has(unit.id);
        return (
          <button
            type="button"
            class={cx(s.talk, on && s.cardOn)}
            aria-pressed={pressed(on)}
            onClick={() => ctx.toggle(unit.id)}
          >
            <span class={s.talkTitle}>{unitTitle(unit)}</span>
            {unit.item?.speakers?.length ? (
              <span class={s.cardSub}>{unit.item.speakers.join(NAME_SEPARATOR)}</span>
            ) : null}
            <OverlapFlags overlaps={ctx.overlaps.get(unit.id)} />
            <Check on={on} />
          </button>
        );
      })}
    </div>
  );
};

// ---------- タイムテーブル（横並び。広い画面） ----------

/** 位置と高さを style の文字列にする */
const boxStyle = (box: { top: number; height: number }) => `top:${box.top}px;height:${box.height}px`;

const GridView: FC<{ doc: EventDoc; day: Day; stageId: string | null; ctx: CardContext }> = ({
  doc,
  day,
  stageId,
  ctx,
}) => {
  const range = gridRange(day);
  if (!range) return <p class={s.empty}>この日の枠はまだありません。</p>;

  const rows = rowsByStage(day);
  const columns = day.stages
    .map((stage, index) => ({ stage, index, color: stageColor(stage, index) }))
    .filter(({ stage }) => stageId === null || stage.id === stageId);
  const dayEvents = day.day_events ?? [];
  const vars = `--cols:${columns.length};--h:${gridHeight(range)}px;--tick:${TICK_MINUTES * PX_PER_MINUTE}px`;

  return (
    <div class={s.grid} style={vars}>
      <div class={s.gridHead}>
        <span />
        {columns.map(({ stage, color }) => (
          <span class={s.gridStage} style={stageStyle(color)}>
            {stage.name}
          </span>
        ))}
      </div>
      <div class={s.gridBody}>
        <div class={s.gridCol}>
          {gridTicks(range).map((tick) => (
            <span class={cx(s.gridTime, tick % 60 === 0 && s.gridTimeHour)} style={`top:${gridOffset(range, tick)}px`}>
              {formatMinutes(tick)}
            </span>
          ))}
        </div>

        {/* 全ステージ共通の開場・休憩などは、列をまたぐ帯にする */}
        <div class={s.gridLayer}>
          {ctx.nowMinutes !== null && range.from <= ctx.nowMinutes && ctx.nowMinutes <= range.to ? (
            <div class={s.gridNow} data-now="true" style={`top:${gridOffset(range, ctx.nowMinutes)}px`}>
              <span class={s.gridNowLabel}>{formatMinutes(ctx.nowMinutes)}</span>
            </div>
          ) : null}
          {dayEvents
            .filter((dayEvent) => !dayEvent.stages?.length)
            .map((dayEvent) => {
              const start = toMinutes(dayEvent.start);
              const end = dayEvent.end ? toMinutes(dayEvent.end) : start;
              const height = Math.max((end - start) * PX_PER_MINUTE, 2);
              return (
                <div
                  class={cx(s.gridBand, end === start && s.gridBandLine)}
                  style={`top:${gridOffset(range, start)}px;height:${height}px`}
                >
                  {dayEvent.title}
                  {dayEvent.end ? ` 〜${dayEvent.end}` : ""}
                </div>
              );
            })}
        </div>

        {columns.map(({ stage, index, color }) => (
          <div class={s.gridCol} style={stageStyle(color)}>
            {/* ステージ別の休憩などは、そのステージの列の中に出す。終了がなければ目盛り1つ分の高さにする */}
            {dayEvents
              .filter((dayEvent) => dayEvent.stages?.includes(stage.id))
              .map((dayEvent) => {
                const start = toMinutes(dayEvent.start);
                const end = dayEvent.end ? toMinutes(dayEvent.end) : start + TICK_MINUTES;
                return (
                  <div class={cx(s.gridSlot, s.gridMarker)} style={boxStyle(gridBox(range, start, end))}>
                    {dayEvent.title}
                  </div>
                );
              })}
            {rows[index].map((row) => {
              const first = row.units[0];
              return (
                <div class={s.gridSlot} style={boxStyle(gridBox(range, first.start, first.end))}>
                  {row.slot.items ? <GridBlock row={row} ctx={ctx} /> : <GridCard doc={doc} unit={first} ctx={ctx} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

/** 横並び表示の枠。高さは枠の時間で決まるので、収まらない分は隠す（全文は title で読める） */
const GridCard: FC<{ doc: EventDoc; unit: Unit; ctx: CardContext }> = ({ doc, unit, ctx }) => {
  const { slot } = unit;
  const on = ctx.selected.has(unit.id);
  const running = isRunning(unit, ctx.nowMinutes);
  const title = unitTitle(unit);
  const sub = [slot.subtitle, slot.note, slot.speakers?.join(NAME_SEPARATOR)].filter(Boolean);
  return (
    <button
      type="button"
      class={cx(s.card, s.cardButton, s.gridCard, on && s.cardOn, running && s.cardLive)}
      aria-pressed={pressed(on)}
      title={title}
      onClick={() => ctx.toggle(unit.id)}
    >
      <span class={s.cardHead}>
        <span class={s.cardTime}>{timeLabel(unit)}</span>
        {running ? <Live /> : null}
        {slot.kind_label ? <span class={s.muted}>{slot.kind_label}</span> : null}
      </span>
      <span class={cx(s.cardTitle, s.gridCardTitle)}>{title}</span>
      {sub.length > 0 ? <span class={cx(s.cardSub, s.oneLine)}>{sub.join(" · ")}</span> : null}
      <Tags doc={doc} tags={slot.tags} />
      <OverlapFlags overlaps={ctx.overlaps.get(unit.id)} />
      <span class={cx(s.check, s.checkSmall, on && s.checkOn)} aria-hidden="true">
        {on ? "✓" : "+"}
      </span>
    </button>
  );
};

/** 横並び表示のブロック。トーク1本ずつを1行で出し、収まらないときは中でスクロールする */
const GridBlock: FC<{ row: ListRow; ctx: CardContext }> = ({ row, ctx }) => {
  const { slot, units } = row;
  const heading = [timeLabel(units[0]), slot.title, slot.kind_label].filter(Boolean).join(" · ");
  const running = isRunning(units[0], ctx.nowMinutes);
  return (
    <div class={cx(s.card, s.gridBlock, running && s.cardLive)}>
      <span class={cx(s.cardHead, s.muted)}>
        {heading}
        {running ? <Live /> : null}
      </span>
      {units.map((unit) => {
        const on = ctx.selected.has(unit.id);
        const title = unitTitle(unit);
        return (
          <button
            type="button"
            class={cx(s.talk, s.gridTalk, on && s.cardOn)}
            aria-pressed={pressed(on)}
            title={title}
            onClick={() => ctx.toggle(unit.id)}
          >
            <span class={cx(s.talkTitle, s.oneLine)}>{title}</span>
            <span class={cx(s.check, s.checkMini, on && s.checkOn)} aria-hidden="true">
              {on ? "✓" : "+"}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ---------- マイテーブル ----------

const MineView: FC<{
  doc: EventDoc;
  /** 表示している日の、選んだ単位 */
  units: Unit[];
  ctx: CardContext;
  /** ほかの日も含めて、何か選んでいるか */
  hasAnySelection: boolean;
  onImage: () => void;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
}> = ({ doc, units, ctx, hasAnySelection, onImage, onExport, onImport, onClear }) => (
  <div class={cx(s.stack, s.mineColumn)}>
    <div class={s.actions}>
      {units.length > 0 ? (
        <button type="button" class={cx(s.action, s.actionPrimary)} onClick={onImage}>
          画像で保存
        </button>
      ) : null}
      <button type="button" class={s.action} onClick={onExport}>
        ファイルに書き出す
      </button>
      <button type="button" class={s.action} onClick={onImport}>
        ファイルから読み込む
      </button>
      {hasAnySelection ? (
        <button type="button" class={cx(s.action, s.actionGhost)} onClick={onClear}>
          すべて解除
        </button>
      ) : null}
    </div>
    {units.length > 0 ? (
      units.map((unit) => <UnitCard doc={doc} unit={unit} ctx={ctx} />)
    ) : (
      <p class={s.emptyBox}>まだ何も選んでいません。「タイムテーブル」で見たい枠をタップしてください。</p>
    )}
    <p class={s.note}>
      選んだ枠はこのブラウザにだけ保存され、サーバーには送信しません。控えを取るときや、別の端末・ブラウザに移すときは、ファイルに書き出して読み込んでください。当日は電波が弱いこともあるので、表示している日の分を画像で保存しておくと安心です。
    </p>
  </div>
);
