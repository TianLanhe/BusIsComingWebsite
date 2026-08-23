import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => undefined;
  }
  const media = window.matchMedia(query);
  media.addEventListener?.("change", onStoreChange);
  return () => media.removeEventListener?.("change", onStoreChange);
}

function getSnapshot() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(query).matches);
}

function getServerSnapshot() {
  return false;
}

/**
 * CSS 负责停止连续风带和 transition；这个订阅负责让 React 同步跳过观察器与离散转场等待。
 * 两层降级不能互相替代，否则运行时切换系统偏好时会留下旧的 JS 状态。
 */
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
