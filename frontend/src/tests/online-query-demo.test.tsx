import { fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OnlineQueryDemoSection } from "../components/online-demo/OnlineQueryDemo";
import { renderWithI18n } from "./test-utils";

describe("OnlineQueryDemoSection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a static Hong Kong bus query demo with limitation notices", () => {
    renderWithI18n(<OnlineQueryDemoSection />);

    expect(screen.getByText("Online Query")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sanitized origin")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sanitized destination")).toBeInTheDocument();
    expect(screen.getByText("Citybus A")).toBeInTheDocument();
    expect(screen.getByText(/static Citybus demo/)).toBeInTheDocument();
  });

  it("does not issue live route requests when the query button is clicked", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));
    renderWithI18n(<OnlineQueryDemoSection />);

    fireEvent.click(screen.getByRole("button", { name: /Search/ }));

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
