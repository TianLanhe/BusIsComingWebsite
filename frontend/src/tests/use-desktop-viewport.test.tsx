import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDesktopViewport } from "../hooks/useDesktopViewport";

describe("desktop download viewport", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the same 821px media-query boundary as the QR layout", () => {
    let listener: (() => void) | undefined;
    const media = { matches: true, media: "(min-width: 821px)", addEventListener: (_: string, next: () => void) => { listener = next; }, removeEventListener: vi.fn() };
    vi.stubGlobal("matchMedia", vi.fn(() => media));
    const { result } = renderHook(() => useDesktopViewport());
    expect(result.current).toBe(true);
    act(() => { media.matches = false; listener?.(); });
    expect(result.current).toBe(false);
  });
});
