import { CalendarDays, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { MonitoringLocale } from "../../app/MonitoringI18nProvider";
import { monitoringCopy } from "../../content/copy";
import { hongKongToday, type PresetDays } from "../../model/dateRange";
import { beginCustomDateFlow, cancelCustomDateFlow, markPickerFallback, selectCustomEndDate, selectCustomStartDate, type CustomDateFlow } from "../../model/dateRangeFlow";

interface AppliedRange {
  startDate: string;
  endDate: string;
}

export function DateRangeControl({ locale, appliedRange, presetDays, onPresetSelect, onCommit, now = () => new Date() }: { locale: MonitoringLocale; appliedRange: AppliedRange; presetDays?: PresetDays; onPresetSelect: (days: PresetDays) => void; onCommit: (startDate: string, endDate: string) => void; now?: () => Date }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [flow, setFlow] = useState<CustomDateFlow>(cancelCustomDateFlow);
  const root = useRef<HTMLDivElement>(null);
  const startInput = useRef<HTMLInputElement>(null);
  const endInput = useRef<HTMLInputElement>(null);
  const t = (key: Parameters<typeof monitoringCopy>[1]) => monitoringCopy(locale, key);
  const today = hongKongToday(now());
  const selectingCustom = flow.step !== "idle";

  useEffect(() => {
    if (!menuOpen) return;
    const dismiss = () => {
      setMenuOpen(false);
      setFlow(cancelCustomDateFlow());
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    const onMouseDown = (event: MouseEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [menuOpen]);

  const openNativePicker = (input: HTMLInputElement | null, current: CustomDateFlow) => {
    // showPicker 只可在用户激活期调用；浏览器拒绝或未实现时保留明确的点击继续入口。
    try {
      if (typeof input?.showPicker !== "function") throw new Error("showPicker unavailable");
      input.showPicker();
      return current;
    } catch {
      return markPickerFallback(current);
    }
  };

  const chooseCustom = () => {
    const next = beginCustomDateFlow();
    // 先同步挂载可见输入框，才可在同一用户手势中尝试浏览器原生选择器。
    flushSync(() => setFlow(next));
    setFlow(openNativePicker(startInput.current, next));
  };

  const choosePreset = (days: PresetDays) => {
    onPresetSelect(days);
    setMenuOpen(false);
    setFlow(cancelCustomDateFlow());
  };

  const chooseStart = (value: string) => {
    const next = selectCustomStartDate(flow, value, today, flow.pickerFallback);
    if (next.step !== "selecting_end") return setFlow(next);
    setFlow(openNativePicker(endInput.current, next));
  };

  const chooseEnd = (value: string) => {
    const next = selectCustomEndDate(flow, value, today);
    setFlow(next);
    if (next.commit) {
      onCommit(next.commit.startDate, next.commit.endDate);
      setMenuOpen(false);
    }
  };

  const openDateField = (input: HTMLInputElement, current: CustomDateFlow) => {
    const next = openNativePicker(input, current);
    if (next !== current) setFlow(next);
  };

  const dismiss = () => {
    setMenuOpen(false);
    setFlow(cancelCustomDateFlow());
  };

  const triggerLabel = formatTriggerLabel(appliedRange, presetDays, t);
  return <div ref={root} className={`date-range-control ${menuOpen ? "is-open" : ""}`}>
    <button type="button" className="monitor-control date-range-trigger" aria-label={`${t("dateRange")}：${triggerLabel}`} aria-expanded={menuOpen} onClick={() => menuOpen ? dismiss() : setMenuOpen(true)}>
      <CalendarDays size={15} /><span>{triggerLabel}</span><ChevronDown size={14} />
    </button>
    {menuOpen && <div className="date-range-popover" role="dialog" aria-label={t("dateRange")}>
      {!selectingCustom ? <div className="date-range-options">
        {([1, 7, 30, 90] as const).map((days) => <button key={days} type="button" className={presetDays === days ? "active" : ""} aria-pressed={presetDays === days} onClick={() => choosePreset(days)}>{t(rangeCopyKey(days))}</button>)}
        <button type="button" className={!presetDays ? "active" : ""} aria-pressed={!presetDays} onClick={chooseCustom}>{t("customRange")}</button>
      </div> : <>
        <p className="date-range-step">{flow.step === "selecting_start" ? t("dateStepStart") : t("dateStepEnd")}</p>
        <div className="date-range-fields">
          <label>{t("startDate")}<input ref={startInput} type="date" value={flow.draftStartDate ?? ""} max={today} onClick={(event) => openDateField(event.currentTarget, flow)} onChange={(event) => chooseStart(event.target.value)} /></label>
          <label>{t("endDate")}<input ref={endInput} type="date" value={flow.draftEndDate ?? ""} min={flow.draftStartDate ?? undefined} max={today} disabled={flow.step !== "selecting_end"} onClick={(event) => openDateField(event.currentTarget, flow)} onChange={(event) => chooseEnd(event.target.value)} /></label>
        </div>
        {flow.pickerFallback && flow.step === "selecting_end" && <button type="button" className="date-range-fallback" onClick={() => endInput.current?.focus()}>{t("chooseEndDate")}</button>}
        {flow.error && <p className="date-range-error" role="alert">{t(flow.error === "future" && flow.step === "selecting_start" ? "dateStartFuture" : dateErrorKey[flow.error])}</p>}
        <button type="button" className="date-range-cancel" onClick={dismiss}><X size={15} />{t("cancel")}</button>
      </>}
    </div>}
  </div>;
}

function formatAppliedRange({ startDate, endDate }: AppliedRange) {
  return `${startDate.replace(/-/g, "/")} – ${endDate.replace(/-/g, "/")}`;
}

function formatTriggerLabel(appliedRange: AppliedRange, presetDays: PresetDays | undefined, t: (key: Parameters<typeof monitoringCopy>[1]) => string) {
  return presetDays ? t(rangeCopyKey(presetDays)) : formatAppliedRange(appliedRange);
}

function rangeCopyKey(days: PresetDays) {
  return days === 1 ? "range1" : days === 7 ? "range7" : days === 30 ? "range30" : "range90";
}

const dateErrorKey = { invalid: "dateInvalid", future: "dateFuture", order: "dateOrder" } as const;
