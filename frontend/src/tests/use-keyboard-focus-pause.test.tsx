import { fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { useKeyboardFocusPause } from "../hooks/useKeyboardFocusPause";

function Harness({ onPause }: { onPause: (paused: boolean) => void }) {
  const rootRef = useRef<HTMLElement>(null);
  const handlers = useKeyboardFocusPause(rootRef, onPause);
  return (
    <section ref={rootRef} onFocusCapture={handlers.onFocusCapture} onBlurCapture={handlers.onBlurCapture}>
      <button type="button">Story</button>
    </section>
  );
}

describe("keyboard-only hero focus pause", () => {
  it("does not pause when a pointer interaction leaves focus on a story button", () => {
    const onPause = vi.fn();
    render(<Harness onPause={onPause} />);
    const story = screen.getByRole("button", { name: "Story" });
    fireEvent.pointerDown(story);
    story.focus();
    expect(onPause).not.toHaveBeenCalledWith(true);
  });

  it("pauses for keyboard focus and clears the pause when pointer input resumes", () => {
    const onPause = vi.fn();
    render(<Harness onPause={onPause} />);
    fireEvent.keyDown(document, { key: "Tab" });
    screen.getByRole("button", { name: "Story" }).focus();
    expect(onPause).toHaveBeenCalledWith(true);

    fireEvent.pointerDown(document.body);
    expect(onPause).toHaveBeenLastCalledWith(false);
  });
});
