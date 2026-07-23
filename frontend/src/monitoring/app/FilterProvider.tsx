import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DateRangeValidationError, resolveDateRange, type DateRangeSelection, type PresetDays, type ResolvedDateRange } from "../model/dateRange";
import type { AnalyticsLocale, AnalyticsQuery, DeviceType, EventType, Granularity, Outcome, Platform, SourceType } from "../services/analyticsTypes";

interface FilterValue {
  query: AnalyticsQuery;
  selection: DateRangeSelection;
  resolvedRange: ResolvedDateRange;
  rangeDays: number;
  setRangeDays: (days: number) => void;
  setCustomRange: (startDate: string, endDate: string) => DateRangeValidationError | null;
  setGranularity: (value: Granularity) => void;
  setCompare: (value: boolean) => void;
  toggleLocale: (value: AnalyticsLocale) => void;
  toggleDevice: (value: DeviceType) => void;
  toggleSource: (value: SourceType) => void;
  toggleOutcome: (value: Outcome) => void;
  togglePlatform: (value: Platform) => void;
  toggleEventType: (value: EventType) => void;
  refreshVersion: number;
  refresh: () => void;
}

const FilterContext = createContext<FilterValue | null>(null);
const defaultSelection: DateRangeSelection = { kind: "preset", presetDays: 30, startDate: null, endDate: null };

export function FilterProvider({ children, now = () => new Date() }: { children: React.ReactNode; now?: () => Date }) {
  const [selection, setSelection] = useState<DateRangeSelection>(defaultSelection);
  const [clockAnchor, setClockAnchor] = useState(() => now());
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [compare, setCompare] = useState(true);
  const [locale, setLocale] = useState<AnalyticsLocale[]>([]);
  const [device, setDevice] = useState<DeviceType[]>([]);
  const [source, setSource] = useState<SourceType[]>([]);
  const [outcome, setOutcome] = useState<Outcome[]>([]);
  const [platform, setPlatform] = useState<Platform[]>([]);
  const [eventType, setEventType] = useState<EventType[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const resolvedRange = useMemo(() => resolveDateRange(selection, clockAnchor), [clockAnchor, selection]);
  const query = useMemo<AnalyticsQuery>(() => ({
    from: resolvedRange.from,
    to: resolvedRange.to,
    granularity,
    compare,
    locale,
    device,
    source,
    outcome,
    platform,
    versionName: [],
    versionCode: [],
    eventType,
  }), [compare, device, eventType, granularity, locale, outcome, platform, resolvedRange.from, resolvedRange.to, source]);

  const setRangeDays = useCallback((days: number) => {
    if (days !== 7 && days !== 30 && days !== 90) return;
    setSelection({ kind: "preset", presetDays: days as PresetDays, startDate: null, endDate: null });
    setClockAnchor(now());
  }, [now]);

  const setCustomRange = useCallback((startDate: string, endDate: string) => {
    const next: DateRangeSelection = { kind: "custom", presetDays: null, startDate, endDate };
    const anchor = now();
    try {
      resolveDateRange(next, anchor);
    } catch (error) {
      return error instanceof DateRangeValidationError ? error : new DateRangeValidationError("invalid");
    }
    setClockAnchor(anchor);
    setSelection(next);
    return null;
  }, [now]);

  const refresh = useCallback(() => {
    setClockAnchor(now());
    setRefreshVersion((value) => value + 1);
  }, [now]);

  const toggle = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, value: T) =>
    setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);

  const value = useMemo<FilterValue>(() => ({
    query,
    selection,
    resolvedRange,
    rangeDays: selection.kind === "preset" ? selection.presetDays! : resolvedRange.dayCount,
    setRangeDays,
    setCustomRange,
    setGranularity,
    setCompare,
    toggleLocale: (item) => toggle(setLocale, item),
    toggleDevice: (item) => toggle(setDevice, item),
    toggleSource: (item) => toggle(setSource, item),
    toggleOutcome: (item) => toggle(setOutcome, item),
    togglePlatform: (item) => toggle(setPlatform, item),
    toggleEventType: (item) => toggle(setEventType, item),
    refreshVersion,
    refresh,
  }), [query, refresh, refreshVersion, resolvedRange, selection, setCustomRange, setRangeDays]);

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useAnalyticsFilters() {
  const value = useContext(FilterContext);
  if (!value) throw new Error("useAnalyticsFilters must be used inside FilterProvider");
  return value;
}
