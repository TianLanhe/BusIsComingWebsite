import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "./useReducedMotion";

export function useDownloadConvergence<T extends HTMLElement>() {
  const targetRef = useRef<T>(null);
  const reducedMotion = useReducedMotion();
  const [converged, setConverged] = useState(false);

  useEffect(() => {
    const target = targetRef.current;
    if (!target || reducedMotion || converged || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) {
        setConverged(true);
        observer.disconnect();
      }
    }, { threshold: [0.5] });
    observer.observe(target);
    return () => observer.disconnect();
  }, [converged, reducedMotion]);

  return { targetRef, converged };
}
