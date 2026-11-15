/** @jsxImportSource hono/jsx/dom */
import type { FC } from "hono/jsx";
import { cx } from "hono/jsx/dom/css";
import { stageColor } from "../../domain/stage-color.ts";
import { isRunning, NAME_SEPARATOR, timeLabel, unitTitle, type Unit } from "../../domain/unit.ts";
import type { EventDoc } from "../../shared/event.ts";
import { Check, Live, OverlapFlags, Relay, Tags } from "./marks.tsx";
import { type CardContext, pressed, stageStyle } from "../ui.ts";
import * as s from "../styles.ts";

/**
 * 選べる単位1つのカード。タップで選ぶ・外す。
 * ブロックの中のトークも、マイテーブルではこのカードで出す（何本目かを添える）
 */
export const UnitCard: FC<{ doc: EventDoc; unit: Unit; ctx: CardContext }> = ({ doc, unit, ctx }) => {
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
      <Relay unit={unit} />
      <OverlapFlags overlaps={ctx.overlaps.get(unit.id)} />
      <Check on={on} />
    </button>
  );
};
