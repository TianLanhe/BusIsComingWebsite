import { useSyncExternalStore } from "react";

const desktopQuery = "(min-width: 821px)";

function subscribe(onChange: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const media = window.matchMedia(desktopQuery);
  media.addEventListener?.("change", onChange);
  return () => media.removeEventListener?.("change", onChange);
}

function snapshot() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(desktopQuery).matches);
}

export function useDesktopViewport() {
  return useSyncExternalStore(subscribe, snapshot, () => false);
}
