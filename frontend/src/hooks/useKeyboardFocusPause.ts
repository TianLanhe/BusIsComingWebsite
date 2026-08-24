import { useCallback, useEffect, useRef } from "react";
import type { FocusEvent, RefObject } from "react";

export function useKeyboardFocusPause(
  rootRef: RefObject<HTMLElement>,
  onPauseChange: (paused: boolean) => void,
) {
  const keyboardModalityRef = useRef(false);

  useEffect(() => {
    const useKeyboardModality = () => {
      keyboardModalityRef.current = true;
      if (rootRef.current?.contains(document.activeElement)) onPauseChange(true);
    };
    const usePointerModality = () => {
      keyboardModalityRef.current = false;
      onPauseChange(false);
    };

    // capture 阶段先于 React 的 focus/按键处理更新模态，避免 pointer 点击遗留
    // DOM focus 后把手动选择误判为需要永久暂停的键盘焦点。
    document.addEventListener("keydown", useKeyboardModality, true);
    document.addEventListener("pointerdown", usePointerModality, true);
    return () => {
      document.removeEventListener("keydown", useKeyboardModality, true);
      document.removeEventListener("pointerdown", usePointerModality, true);
    };
  }, [onPauseChange, rootRef]);

  const onFocusCapture = useCallback(() => {
    if (keyboardModalityRef.current) onPauseChange(true);
  }, [onPauseChange]);

  const onBlurCapture = useCallback((event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) onPauseChange(false);
  }, [onPauseChange]);

  return { onFocusCapture, onBlurCapture };
}
