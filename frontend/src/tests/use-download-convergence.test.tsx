import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDownloadConvergence } from "../hooks/useDownloadConvergence";

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  root = null;
  rootMargin = "0px";
  thresholds = [0.5];
  takeRecords = () => [];
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IntersectionObserverMock.instances.push(this);
  }
  emit(ratio: number) {
    this.callback([{ isIntersecting: ratio > 0, intersectionRatio: ratio } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
  }
}

afterEach(() => {
  IntersectionObserverMock.instances = [];
  vi.unstubAllGlobals();
});

describe("useDownloadConvergence", () => {
  function Harness() {
    const { targetRef, converged } = useDownloadConvergence<HTMLElement>();
    return <section data-testid="target" data-converged={converged ? "true" : "false"} ref={targetRef} />;
  }

  it("converges once at half visibility and disconnects", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    render(<Harness />);
    const target = screen.getByTestId("target");
    const observer = IntersectionObserverMock.instances[IntersectionObserverMock.instances.length - 1]!;
    expect(observer.observe).toHaveBeenCalledWith(target);
    act(() => observer.emit(0.49));
    expect(target).toHaveAttribute("data-converged", "false");
    act(() => observer.emit(0.5));
    expect(target).toHaveAttribute("data-converged", "true");
    expect(observer.disconnect).toHaveBeenCalled();
    expect(IntersectionObserverMock.instances).toHaveLength(1);
  });

  it("does not observe when reduced motion is requested", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    render(<Harness />);
    expect(IntersectionObserverMock.instances).toHaveLength(0);
    expect(screen.getByTestId("target")).toHaveAttribute("data-converged", "false");
  });
});
