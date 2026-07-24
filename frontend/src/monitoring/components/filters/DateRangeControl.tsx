import { CalendarDays, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { MonitoringLocale } from "../../app/MonitoringI18nProvider";
import { monitoringCopy } from "../../content/copy";
import { hongKongToday } from "../../model/dateRange";
import { beginCustomDateFlow, cancelCustomDateFlow, markPickerFallback, selectCustomEndDate, selectCustomStartDate, type CustomDateFlow } from "../../model/dateRangeFlow";

interface AppliedRange {
  startDate: string;
  endDate: string;
}

export function DateRangeControl({ locale, appliedRange, presetDays, onCommit, now = () => new Date() }: { locale: MonitoringLocale; appliedRange: AppliedRange; presetDays?: 7 | 30 | 90; onCommit: (startDate: string, endDate: string) => void; now?: () => Date }) {
  const [flow, setFlow] = useState<CustomDateFlow>(cancelCustomDateFlow);
  const root = useRef<HTMLDivElement>(null);
  const startInput = useRef<HTMLInputElement>(null);
  const endInput = useRef<HTMLInputElement>(null);
  const t = (key: Parameters<typeof monitoringCopy>[1]) => monitoringCopy(locale, key);
  const today = hongKongToday(now());
  const active = flow.step !== "idle";

  useEffect(() => {
    if (!active) return;
    const dismiss = () => setFlow(cancelCustomDateFlow());
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
  }, [active]);

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

  const chooseStart = (value: string) => {
    const next = selectCustomStartDate(flow, value, today, flow.pickerFallback);
    if (next.step !== "selecting_end") return setFlow(next);
    setFlow(openNativePicker(endInput.current, next));
  };

  const chooseEnd = (value: string) => {
    const next = selectCustomEndDate(flow, value, today);
    setFlow(next);
    if (next.commit) onCommit(next.commit.startDate, next.commit.endDate);
  };

  const triggerLabel = formatTriggerLabel(flow, appliedRange, presetDays, t);
  return <div ref={root} className={`date-range-control ${active ? "is-open" : ""}`}>
    <button type="button" className="monitor-control date-range-trigger" aria-label={`${t("customRange")}：${triggerLabel}`} aria-expanded={active} onClick={chooseCustom}>
      <CalendarDays size={15} /><span>{triggerLabel}</span><ChevronDown size={14} />
    </button>
    {active && <div className="date-range-popover" role="dialog" aria-label={t("dateRange")}>
      <p className="date-range-step">{flow.step === "selecting_start" ? t("dateStepStart") : t("dateStepEnd")}</p>
      <div className="date-range-fields">
        <label>{t("startDate")}<input ref={startInput} type="date" value={flow.draftStartDate ?? ""} max={today} onChange={(event) => chooseStart(event.target.value)} /></label>
        <label>{t("endDate")}<input ref={endInput} type="date" value={flow.draftEndDate ?? ""} min={flow.draftStartDate ?? undefined} max={today} disabled={flow.step !== "selecting_end"} onChange={(event) => chooseEnd(event.target.value)} /></label>
      </div>
      {flow.pickerFallback && flow.step === "selecting_end" && <button type="button" className="date-range-fallback" onClick={() => endInput.current?.focus()}>{t("chooseEndDate")}</button>}
      {flow.error && <p className="date-range-error" role="alert">{t(flow.error === "future" && flow.step === "selecting_start" ? "dateStartFuture" : dateErrorKey[flow.error])}</p>}
      <button type="button" className="date-range-cancel" onClick={() => setFlow(cancelCustomDateFlow())}><X size={15} />{t("cancel")}</button>
    </div>}
  </div>;
}

function formatAppliedRange({ startDate, endDate }: AppliedRange) {
  return `${startDate.replace(/-/g, "/")} – ${endDate.replace(/-/g, "/")}`;
}

function formatTriggerLabel(flow: CustomDateFlow, appliedRange: AppliedRange, presetDays: 7 | 30 | 90 | undefined, t: (key: Parameters<typeof monitoringCopy>[1]) => string) {
  if (flow.step === "selecting_start") return t("dateStepStart");
  if (flow.step === "selecting_end") return `${flow.draftStartDate?.replace(/-/g, "/")} – ${t("dateStepEnd")}`;
  return presetDays ? t(presetDays === 7 ? "range7" : presetDays === 30 ? "range30" : "range90") : formatAppliedRange(appliedRange);
}

const dateErrorKey = { invalid: "dateInvalid", future: "dateFuture", order: "dateOrder" } as const;
