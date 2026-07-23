import { describe, expect, it } from "vitest";
import { beginCustomDateFlow, cancelCustomDateFlow, selectCustomEndDate, selectCustomStartDate } from "./dateRangeFlow";

describe("CustomDateFlow", () => {
  it("keeps draft dates out of the query until a legal end date commits once", () => {
    const selectingStart = beginCustomDateFlow();
    expect(selectingStart).toMatchObject({ step: "selecting_start", draftStartDate: null, draftEndDate: null });

    const selectingEnd = selectCustomStartDate(selectingStart, "2026-07-01", "2026-07-24");
    expect(selectingEnd).toMatchObject({ step: "selecting_end", draftStartDate: "2026-07-01", commit: null });

    const completed = selectCustomEndDate(selectingEnd, "2026-07-03", "2026-07-24");
    expect(completed).toMatchObject({ step: "idle", commit: { startDate: "2026-07-01", endDate: "2026-07-03" } });
  });

  it("preserves the draft on illegal ranges and clears it on cancellation", () => {
    const selectingEnd = selectCustomStartDate(beginCustomDateFlow(), "2026-07-23", "2026-07-24");
    const invalidOrder = selectCustomEndDate(selectingEnd, "2026-07-22", "2026-07-24");
    expect(invalidOrder).toMatchObject({ step: "selecting_end", draftStartDate: "2026-07-23", error: "order", commit: null });

    const future = selectCustomEndDate(selectingEnd, "2026-07-25", "2026-07-24");
    expect(future).toMatchObject({ step: "selecting_end", error: "future", commit: null });
    expect(cancelCustomDateFlow(future)).toEqual({ step: "idle", draftStartDate: null, draftEndDate: null, error: null, pickerFallback: false, commit: null });
  });

  it("flags picker fallback without losing the currently selected step", () => {
    const selectingEnd = selectCustomStartDate(beginCustomDateFlow(), "2025-12-31", "2026-07-24", true);
    expect(selectingEnd).toMatchObject({ step: "selecting_end", draftStartDate: "2025-12-31", pickerFallback: true });
  });
});
