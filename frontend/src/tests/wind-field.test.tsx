import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WindField } from "../components/homepage/WindField";

describe("WindField", () => {
  it("is a five-layer decorative field with explicit intensity and pause state", () => {
    const { container } = render(<WindField intensity="download" paused />);
    const field = container.firstElementChild;
    expect(field).toHaveAttribute("aria-hidden", "true");
    expect(field).toHaveAttribute("data-intensity", "download");
    expect(field).toHaveAttribute("data-paused", "true");
    expect(field?.querySelectorAll("span")).toHaveLength(5);
    expect(field?.querySelector("a,button,input,[tabindex]")).toBeNull();
  });
});
