import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FilterProvider, useAnalyticsFilters } from "./FilterProvider";

function Probe() {
  const filters = useAnalyticsFilters();
  return <>
    <output data-testid="query">{JSON.stringify(filters.query)}</output>
    <output data-testid="selection">{JSON.stringify(filters.selection)}</output>
    <button onClick={() => filters.setRangeDays(7)}>seven</button>
    <button onClick={() => filters.setCustomRange("2026-07-01", "2026-07-02")}>history</button>
    <button onClick={() => filters.toggleOutcome("failure")}>failure</button>
    <button onClick={filters.refresh}>refresh</button>
  </>;
}

describe("FilterProvider", () => {
  it("keeps the date selection and filters independent from the refresh clock", () => {
    let instant = new Date("2026-07-23T00:30:00+08:00");
    render(<FilterProvider now={() => instant}><Probe /></FilterProvider>);

    fireEvent.click(screen.getByText("seven"));
    fireEvent.click(screen.getByText("failure"));
    expect(screen.getByTestId("query")).toHaveTextContent("2026-07-17T00:00:00+08:00");
    expect(screen.getByTestId("query")).toHaveTextContent("failure");

    instant = new Date("2026-07-23T00:31:00+08:00");
    fireEvent.click(screen.getByText("refresh"));
    expect(screen.getByTestId("query")).toHaveTextContent("2026-07-23T00:31:00+08:00");
    expect(screen.getByTestId("selection")).toHaveTextContent('"presetDays":7');
    expect(screen.getByTestId("query")).toHaveTextContent("failure");
  });

  it("does not drift a fixed historical range when refreshed", () => {
    let instant = new Date("2026-07-23T00:30:00+08:00");
    render(<FilterProvider now={() => instant}><Probe /></FilterProvider>);
    fireEvent.click(screen.getByText("history"));
    const before = screen.getByTestId("query").textContent;

    instant = new Date("2026-07-24T09:00:00+08:00");
    fireEvent.click(screen.getByText("refresh"));
    expect(screen.getByTestId("query").textContent).toBe(before);
  });
});
