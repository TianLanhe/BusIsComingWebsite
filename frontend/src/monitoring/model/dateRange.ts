export type PresetDays = 7 | 30 | 90;

export interface DateRangeSelection {
  kind: "preset" | "custom";
  presetDays: PresetDays | null;
  startDate: string | null;
  endDate: string | null;
}

export interface ResolvedDateRange {
  from: string;
  to: string;
  displayStartDate: string;
  displayEndDate: string;
  includesToday: boolean;
  dayCount: number;
  comparisonFrom: string;
  comparisonTo: string;
}

export type DateRangeValidationCode = "invalid" | "future" | "order";

export class DateRangeValidationError extends Error {
  constructor(readonly code: DateRangeValidationCode) {
    super(code);
    this.name = "DateRangeValidationError";
  }
}

const dayMs = 24 * 60 * 60 * 1000;

export function resolveDateRange(selection: DateRangeSelection, now: Date): ResolvedDateRange {
  const today = hongKongDate(now);
  let startDate: string;
  let endDate: string;

  if (selection.kind === "preset") {
    if (selection.presetDays !== 7 && selection.presetDays !== 30 && selection.presetDays !== 90) {
      throw new DateRangeValidationError("invalid");
    }
    endDate = today;
    startDate = addCalendarDays(today, -(selection.presetDays - 1));
  } else {
    startDate = requireCalendarDate(selection.startDate);
    endDate = requireCalendarDate(selection.endDate);
    if (startDate > endDate) throw new DateRangeValidationError("order");
    if (endDate > today) throw new DateRangeValidationError("future");
  }

  const includesToday = endDate === today;
  const from = hongKongMidnight(startDate);
  // API 使用半开区间：[from,to)。今天尚未结束，因此上界取刷新瞬间；历史日期取结束日次日 00:00。
  const to = includesToday ? formatHongKongInstant(now) : hongKongMidnight(addCalendarDays(endDate, 1));
  const duration = new Date(to).getTime() - new Date(from).getTime();

  return {
    from,
    to,
    displayStartDate: startDate,
    displayEndDate: endDate,
    includesToday,
    dayCount: calendarDistance(startDate, endDate) + 1,
    comparisonFrom: formatHongKongInstant(new Date(new Date(from).getTime() - duration)),
    comparisonTo: from,
  };
}

function requireCalendarDate(value: string | null): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new DateRangeValidationError("invalid");
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (candidate.toISOString().slice(0, 10) !== value) throw new DateRangeValidationError("invalid");
  return value;
}

function hongKongDate(date: Date): string {
  if (Number.isNaN(date.getTime())) throw new DateRangeValidationError("invalid");
  return new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export function hongKongToday(date: Date): string {
  return hongKongDate(date);
}

function hongKongMidnight(date: string): string {
  return `${date}T00:00:00+08:00`;
}

function formatHongKongInstant(date: Date): string {
  const local = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return `${local.toISOString().slice(0, 19)}+08:00`;
}

function addCalendarDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function calendarDistance(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / dayMs);
}
