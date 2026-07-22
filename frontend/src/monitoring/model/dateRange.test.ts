import { describe, expect, it } from "vitest";
import { DateRangeValidationError, resolveDateRange, type DateRangeSelection } from "./dateRange";

const preset = (days: 7 | 30 | 90): DateRangeSelection => ({
  kind: "preset",
  presetDays: days,
  startDate: null,
  endDate: null,
});

const custom = (startDate: string, endDate: string): DateRangeSelection => ({
  kind: "custom",
  presetDays: null,
  startDate,
  endDate,
});

describe("resolveDateRange", () => {
  it.each([
    [7, "2026-07-17", 7],
    [30, "2026-06-24", 30],
    [90, "2026-04-25", 90],
  ] as const)("includes Hong Kong today in the last %i calendar days", (days, start, count) => {
    const result = resolveDateRange(preset(days), new Date("2026-07-23T00:30:00+08:00"));

    expect(result.displayStartDate).toBe(start);
    expect(result.displayEndDate).toBe("2026-07-23");
    expect(result.from).toBe(`${start}T00:00:00+08:00`);
    expect(result.to).toBe("2026-07-23T00:30:00+08:00");
    expect(result.dayCount).toBe(count);
    expect(result.includesToday).toBe(true);
  });

  it("does not depend on the browser timezone and crosses year boundaries", () => {
    const result = resolveDateRange(preset(7), new Date("2025-12-31T17:05:00-05:00"));
    expect(result.displayStartDate).toBe("2025-12-26");
    expect(result.displayEndDate).toBe("2026-01-01");
  });

  it("treats custom dates as inclusive and keeps a historical upper bound fixed", () => {
    const result = resolveDateRange(custom("2026-06-29", "2026-07-02"), new Date("2026-07-23T10:00:00Z"));
    expect(result.from).toBe("2026-06-29T00:00:00+08:00");
    expect(result.to).toBe("2026-07-03T00:00:00+08:00");
    expect(result.dayCount).toBe(4);
    expect(result.includesToday).toBe(false);
  });

  it("uses the current instant when a custom range ends today", () => {
    const result = resolveDateRange(custom("2026-07-22", "2026-07-23"), new Date("2026-07-23T07:08:09Z"));
    expect(result.to).toBe("2026-07-23T15:08:09+08:00");
    expect(result.includesToday).toBe(true);
  });

  it("derives an adjacent comparison window with equal duration", () => {
    const result = resolveDateRange(custom("2026-07-10", "2026-07-12"), new Date("2026-07-23T10:00:00Z"));
    expect(result.comparisonTo).toBe(result.from);
    expect(new Date(result.comparisonTo).getTime() - new Date(result.comparisonFrom).getTime())
      .toBe(new Date(result.to).getTime() - new Date(result.from).getTime());
  });

  it.each([
    [custom("2026-02-30", "2026-03-01"), "invalid"],
    [custom("2026-07-24", "2026-07-23"), "order"],
    [custom("2026-07-20", "2026-07-24"), "future"],
  ] as const)("rejects invalid selections", (selection, code) => {
    try {
      resolveDateRange(selection, new Date("2026-07-23T10:00:00Z"));
      expect.fail("expected a validation error");
    } catch (error) {
      expect(error).toBeInstanceOf(DateRangeValidationError);
      expect((error as DateRangeValidationError).code).toBe(code);
    }
  });
});
