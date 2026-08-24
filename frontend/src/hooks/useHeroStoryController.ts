import { useCallback, useEffect, useRef, useState } from "react";
import type { HeroStoryId, Locale } from "../content/types";

export type HeroSelectionOrigin = "initial" | "automatic" | "manual" | "locale" | "resume";
export type HeroPauseReason = "hover" | "focus" | "offscreen" | "hidden" | "visual-review" | "reduced-motion";

export function useHeroStoryController({ storyIds: _storyIds, locale: _locale }: {
  storyIds: HeroStoryId[];
  locale: Locale;
}) {
  const storyIds = _storyIds;
  const locale = _locale;
  const initialStoryId = storyIds[0];
  const [requestedStoryId, setRequestedStoryId] = useState<HeroStoryId>(initialStoryId);
  const [settledStoryId, setSettledStoryId] = useState<HeroStoryId>(initialStoryId);
  const [transitionEpoch, setTransitionEpoch] = useState(0);
  const [selectionOrigin, setSelectionOrigin] = useState<HeroSelectionOrigin>("initial");
  const [pauseVersion, setPauseVersion] = useState(0);
  const requestedRef = useRef(initialStoryId);
  const epochRef = useRef(0);
  const pauseReasonsRef = useRef(new Set<HeroPauseReason>());
  const previousLocaleRef = useRef(locale);

  const selectStory = useCallback((storyId: HeroStoryId, origin: HeroSelectionOrigin) => {
    // 点当前故事只重建完整阅读周期，不生成新的 epoch，避免同一画面重播转场。
    // locale 即使故事 ID 相同也必须生成 epoch，Stage 才会等待目标语言图片稳定。
    if (origin === "manual" && storyId === requestedRef.current) {
      setSelectionOrigin("manual");
      setPauseVersion((value) => value + 1);
      return;
    }
    requestedRef.current = storyId;
    epochRef.current += 1;
    setRequestedStoryId(storyId);
    setTransitionEpoch(epochRef.current);
    setSelectionOrigin(origin);
  }, []);

  const markSettled = useCallback((storyId: HeroStoryId, epoch: number) => {
    // 只有最新请求的 epoch 可以提交 settled，防止快速点击后的旧图片/load 事件回写状态。
    if (epoch !== epochRef.current || storyId !== requestedRef.current) return;
    setSettledStoryId(storyId);
  }, []);

  const setPauseReason = useCallback((reason: HeroPauseReason, paused: boolean) => {
    const reasons = pauseReasonsRef.current;
    const before = reasons.size;
    if (paused) reasons.add(reason);
    else reasons.delete(reason);
    if (reasons.size !== before) {
      if (!paused && reasons.size === 0) setSelectionOrigin("resume");
      setPauseVersion((value) => value + 1);
    }
  }, []);

  useEffect(() => {
    if (previousLocaleRef.current === locale) return;
    previousLocaleRef.current = locale;
    selectStory(requestedRef.current, "locale");
  }, [locale, selectStory]);

  useEffect(() => {
    if (pauseReasonsRef.current.size > 0 || requestedStoryId !== settledStoryId) return;
    // 初次/手动/语言/恢复给足阅读时间；仅连续自动播放使用 5 秒 dwell。
    const delay = selectionOrigin === "automatic" ? 5_000 : 10_000;
    const timer = window.setTimeout(() => {
      const currentIndex = storyIds.indexOf(requestedRef.current);
      selectStory(storyIds[(currentIndex + 1) % storyIds.length], "automatic");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [pauseVersion, requestedStoryId, selectionOrigin, selectStory, settledStoryId, storyIds]);

  return {
    requestedStoryId,
    settledStoryId,
    transitionEpoch,
    selectionOrigin,
    selectStory,
    markSettled,
    setPauseReason,
  };
}
