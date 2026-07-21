import { createContext, useContext, useMemo, useState } from "react";
import type { AnalyticsLocale, AnalyticsQuery, DeviceType, Granularity, Outcome, Platform, SourceType } from "../services/analyticsTypes";

interface FilterValue {
  query: AnalyticsQuery;
  rangeDays: number;
  setRangeDays: (days: number) => void;
  setGranularity: (value: Granularity) => void;
  setCompare: (value: boolean) => void;
  toggleLocale: (value: AnalyticsLocale) => void;
  toggleDevice: (value: DeviceType) => void;
  toggleSource: (value: SourceType) => void;
  toggleOutcome: (value: Outcome) => void;
  togglePlatform: (value: Platform) => void;
  refreshVersion: number;
  refresh: () => void;
}

const FilterContext = createContext<FilterValue | null>(null);

export function FilterProvider({ children, now = () => new Date() }: { children: React.ReactNode; now?: () => Date }) {
  const [rangeDays, setRangeDays] = useState(30);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [compare, setCompare] = useState(true);
  const [locale, setLocale] = useState<AnalyticsLocale[]>([]);
  const [device, setDevice] = useState<DeviceType[]>([]);
  const [source, setSource] = useState<SourceType[]>([]);
  const [outcome, setOutcome] = useState<Outcome[]>([]);
  const [platform, setPlatform] = useState<Platform[]>([]);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const boundaries = useMemo(() => hongKongRange(now(), rangeDays), [now, rangeDays]);
  const query = useMemo<AnalyticsQuery>(() => ({
    ...boundaries, granularity, compare, locale, device, source, outcome, platform, versionName: [], versionCode: [],
  }), [boundaries, compare, device, granularity, locale, outcome, platform, source]);
  const toggle = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, value: T) => setter((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  const value = useMemo<FilterValue>(() => ({
    query, rangeDays, setRangeDays, setGranularity, setCompare,
    toggleLocale: (item) => toggle(setLocale, item), toggleDevice: (item) => toggle(setDevice, item),
    toggleSource: (item) => toggle(setSource, item), toggleOutcome: (item) => toggle(setOutcome, item),
    togglePlatform: (item) => toggle(setPlatform, item), refreshVersion, refresh: () => setRefreshVersion((value) => value + 1),
  }), [query, rangeDays, refreshVersion]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useAnalyticsFilters() {
  const value = useContext(FilterContext);
  if (!value) throw new Error("useAnalyticsFilters must be used inside FilterProvider");
  return value;
}

function hongKongRange(now: Date, days: number): Pick<AnalyticsQuery, "from" | "to"> {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Hong_Kong", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map((part) => [part.type, part.value]));
  const endUTC = new Date(`${parts.year}-${parts.month}-${parts.day}T00:00:00+08:00`);
  const startUTC = new Date(endUTC.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: hkDate(startUTC), to: hkDate(endUTC) };
}

function hkDate(date: Date): string {
  const local = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return `${local.toISOString().slice(0, 19)}+08:00`;
}
