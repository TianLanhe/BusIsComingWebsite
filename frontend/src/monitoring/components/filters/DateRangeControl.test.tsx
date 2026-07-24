import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateRangeControl } from "./DateRangeControl";
import "../../styles/dashboard.css";

describe("DateRangeControl", () => {
  it("uses the localized preset name until a custom range is applied", () => {
    const { rerender } = render(<DateRangeControl locale="zh-Hans" appliedRange={{ startDate: "2026-07-18", endDate: "2026-07-24" }} presetDays={7} onPresetSelect={vi.fn()} onCommit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /最近 7 天/ })).toBeInTheDocument();
    rerender(<DateRangeControl locale="zh-Hans" appliedRange={{ startDate: "2026-07-01", endDate: "2026-07-24" }} onPresetSelect={vi.fn()} onCommit={vi.fn()} />);
    expect(screen.getByRole("button", { name: /2026\/07\/01/ })).toBeInTheDocument();
  });
  afterEach(() => {
    delete (HTMLInputElement.prototype as { showPicker?: () => void }).showPicker;
  });

  it("opens the native start picker from the custom-date gesture and advances to end selection", () => {
    const onCommit = vi.fn();
    const showPicker = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", { configurable: true, value: showPicker });
    render(<DateRangeControl locale="zh-Hans" appliedRange={{ startDate: "2026-07-01", endDate: "2026-07-24" }} onPresetSelect={vi.fn()} onCommit={onCommit} />);

    fireEvent.click(screen.getByRole("button", { name: /日期范围/ }));
    fireEvent.click(screen.getByRole("button", { name: "自定义日期" }));
    expect(showPicker).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog", { name: "日期范围" })).toHaveTextContent("第 1 步：选择开始日期");

    const startInput = screen.getByLabelText("开始日期");
    fireEvent.change(startInput, { target: { value: "2026-07-01" } });
    expect(screen.getByRole("dialog", { name: "日期范围" })).toHaveTextContent("第 2 步：选择结束日期");
  });

  it("keeps a visible, focusable inline input when showPicker is missing and commits once", () => {
    const onCommit = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", { configurable: true, value: undefined });
    render(<DateRangeControl locale="en" appliedRange={{ startDate: "2026-07-01", endDate: "2026-07-24" }} onPresetSelect={vi.fn()} onCommit={onCommit} />);
    fireEvent.click(screen.getByRole("button", { name: /Date range/ }));
    fireEvent.click(screen.getByRole("button", { name: "Custom dates" }));
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-07-01" } });
    const endInput = screen.getByLabelText("End date");
    expect(endInput).toBeVisible();
    const focus = vi.spyOn(endInput, "focus");
    fireEvent.click(screen.getByRole("button", { name: "Choose end date" }));
    expect(focus).toHaveBeenCalledOnce();

    fireEvent.change(endInput, { target: { value: "2026-07-03" } });
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(onCommit).toHaveBeenCalledWith("2026-07-01", "2026-07-03");
  });

  it("does not retry a throwing showPicker from the fallback action", () => {
    const onCommit = vi.fn();
    const showPicker = vi.fn(() => { throw new DOMException("blocked"); });
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", { configurable: true, value: showPicker });
    render(<DateRangeControl locale="en" appliedRange={{ startDate: "2026-07-01", endDate: "2026-07-24" }} onPresetSelect={vi.fn()} onCommit={onCommit} />);
    fireEvent.click(screen.getByRole("button", { name: /Date range/ }));
    fireEvent.click(screen.getByRole("button", { name: "Custom dates" }));
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-07-01" } });
    const endInput = screen.getByLabelText("End date");
    const focus = vi.spyOn(endInput, "focus");
    fireEvent.click(screen.getByRole("button", { name: "Choose end date" }));

    expect(showPicker).toHaveBeenCalledTimes(2);
    expect(focus).toHaveBeenCalledOnce();
    fireEvent.change(endInput, { target: { value: "2026-07-03" } });
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("keeps controls at least 44px high and cancellation leaves the applied range untouched", () => {
    const onCommit = vi.fn();
    render(<DateRangeControl locale="zh-Hant" appliedRange={{ startDate: "2026-07-01", endDate: "2026-07-24" }} onPresetSelect={vi.fn()} onCommit={onCommit} />);
    const trigger = screen.getByRole("button", { name: /日期範圍/ });
    expect(trigger).toHaveStyle({ minHeight: "44px" });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("button", { name: "自訂日期" }));
    fireEvent.click(screen.getByRole("button", { name: "取消" }));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("cancels the draft with Escape or an outside click without applying a query range", () => {
    const onCommit = vi.fn();
    const { container } = render(<><DateRangeControl locale="zh-Hans" appliedRange={{ startDate: "2026-07-01", endDate: "2026-07-24" }} onPresetSelect={vi.fn()} onCommit={onCommit} /><button type="button">outside</button></>);
    fireEvent.click(screen.getByRole("button", { name: /日期范围/ }));
    fireEvent.click(screen.getByRole("button", { name: "自定义日期" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "日期范围" })).not.toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /日期范围/ }));
    fireEvent.click(screen.getByRole("button", { name: "自定义日期" }));
    fireEvent.mouseDown(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryByRole("dialog", { name: "日期范围" })).not.toBeInTheDocument();
    expect(onCommit).not.toHaveBeenCalled();
    expect(container.querySelector(".date-range-control")).toBeInTheDocument();
  });

  it("uses future-start copy instead of an end-date message", () => {
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", { configurable: true, value: vi.fn() });
    render(<DateRangeControl locale="en" appliedRange={{ startDate: "2026-07-01", endDate: "2026-07-24" }} onPresetSelect={vi.fn()} onCommit={vi.fn()} now={() => new Date("2026-07-24T12:00:00+08:00")} />);
    fireEvent.click(screen.getByRole("button", { name: /Date range/ }));
    fireEvent.click(screen.getByRole("button", { name: "Custom dates" }));
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-07-25" } });
    expect(screen.getByRole("alert")).toHaveTextContent("start date cannot be after today in Hong Kong");
  });

  it("offers all presets, applies one directly, and opens the native picker from the whole date field", () => {
    const onPresetSelect = vi.fn();
    const showPicker = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, "showPicker", { configurable: true, value: showPicker });
    render(<DateRangeControl locale="zh-Hans" appliedRange={{ startDate: "2026-06-25", endDate: "2026-07-24" }} presetDays={30} onPresetSelect={onPresetSelect} onCommit={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /日期范围/ }));
    for (const label of ["最近 1 天", "最近 7 天", "最近 30 天", "最近 90 天", "自定义日期"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
    fireEvent.click(screen.getByRole("button", { name: "最近 1 天" }));
    expect(onPresetSelect).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole("button", { name: /日期范围/ }));
    fireEvent.click(screen.getByRole("button", { name: "自定义日期" }));
    showPicker.mockClear();
    fireEvent.click(screen.getByLabelText("开始日期"));
    expect(showPicker).toHaveBeenCalledOnce();
  });
});
