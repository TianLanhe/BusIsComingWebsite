import type { DateRangeValidationCode } from "./dateRange";

export type CustomDateStep = "idle" | "selecting_start" | "selecting_end";

export interface CustomDateFlow {
  step: CustomDateStep;
  draftStartDate: string | null;
  draftEndDate: string | null;
  error: DateRangeValidationCode | null;
  pickerFallback: boolean;
  commit: { startDate: string; endDate: string } | null;
}

export function beginCustomDateFlow(): CustomDateFlow {
  return { step: "selecting_start", draftStartDate: null, draftEndDate: null, error: null, pickerFallback: false, commit: null };
}

export function cancelCustomDateFlow(_current?: CustomDateFlow): CustomDateFlow {
  return { step: "idle", draftStartDate: null, draftEndDate: null, error: null, pickerFallback: false, commit: null };
}

export function selectCustomStartDate(flow: CustomDateFlow, startDate: string, hongKongToday: string, pickerFallback = false): CustomDateFlow {
  const error = validateDate(startDate, hongKongToday);
  if (error) return { ...flow, error, commit: null };
  // 草稿只服务两步交互；完整范围提交前绝不影响 Provider 的已应用查询范围。
  return { step: "selecting_end", draftStartDate: startDate, draftEndDate: null, error: null, pickerFallback, commit: null };
}

export function selectCustomEndDate(flow: CustomDateFlow, endDate: string, hongKongToday: string): CustomDateFlow {
  if (!flow.draftStartDate) return { ...flow, error: "invalid", commit: null };
  const error = validateDate(endDate, hongKongToday) ?? (flow.draftStartDate > endDate ? "order" : null);
  if (error) return { ...flow, draftEndDate: endDate, error, commit: null };
  return { step: "idle", draftStartDate: flow.draftStartDate, draftEndDate: endDate, error: null, pickerFallback: false, commit: { startDate: flow.draftStartDate, endDate } };
}

export function markPickerFallback(flow: CustomDateFlow): CustomDateFlow {
  return { ...flow, pickerFallback: true };
}

function validateDate(value: string, today: string): DateRangeValidationCode | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "invalid";
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.toISOString().slice(0, 10) !== value) return "invalid";
  return value > today ? "future" : null;
}
