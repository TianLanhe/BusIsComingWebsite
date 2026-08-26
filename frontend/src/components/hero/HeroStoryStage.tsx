import { useEffect, useRef, useState } from "react";
import { getStoryAsset } from "../../content/storyAssets";
import type { HeroStageSlot, HeroStory, HeroStoryId } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./HeroStoryStage.module.css";

const slotByDelta: HeroStageSlot[] = ["front", "near-right", "far-right", "far-left", "near-left"];

export function stageSlotFor(stories: HeroStory[], storyId: HeroStoryId, activeStoryId: HeroStoryId): HeroStageSlot {
  const storyIndex = stories.findIndex((story) => story.id === storyId);
  const activeIndex = stories.findIndex((story) => story.id === activeStoryId);
  return slotByDelta[(storyIndex - activeIndex + stories.length) % stories.length];
}

export function HeroStoryStage({
  stories,
  requestedStoryId,
  settledStoryId,
  transitionEpoch,
  onSettled,
}: {
  stories: HeroStory[];
  requestedStoryId: HeroStoryId;
  settledStoryId: HeroStoryId;
  transitionEpoch: number;
  onSettled: (storyId: HeroStoryId, epoch: number) => void;
}) {
  const { locale, text } = useI18n();
  const reducedMotion = useReducedMotion();
  const figureRefs = useRef(new Map<HeroStoryId, HTMLElement>());
  const imageRefs = useRef(new Map<HeroStoryId, HTMLImageElement>());
  const [failedAssets, setFailedAssets] = useState(() => new Set<string>());
  const [transitionState, setTransitionState] = useState<"moving" | "settled">("settled");

  useEffect(() => {
    if (transitionEpoch === 0) return;
    let cancelled = false;
    let imageReady = false;
    let transformReady = reducedMotion;
    const targetFigure = figureRefs.current.get(requestedStoryId);
    const targetImage = imageRefs.current.get(requestedStoryId);
    const assetKey = `${requestedStoryId}:${locale}`;
    setTransitionState("moving");

    const finish = () => {
      if (cancelled || !imageReady || !transformReady) return;
      setTransitionState("settled");
      onSettled(requestedStoryId, transitionEpoch);
    };
    const markImageReady = () => { imageReady = true; finish(); };
    const markImageFailed = () => {
      setFailedAssets((current) => new Set(current).add(assetKey));
      markImageReady();
    };
    const markTransformReady = (event?: TransitionEvent) => {
      if (event && event.propertyName !== "transform") return;
      transformReady = true;
      finish();
    };

    if (!targetImage || failedAssets.has(assetKey)) markImageReady();
    else if (targetImage.complete) targetImage.decode?.().then(markImageReady, markImageFailed) ?? markImageReady();
    else {
      targetImage.addEventListener("load", markImageReady, { once: true });
      targetImage.addEventListener("error", markImageFailed, { once: true });
    }
    targetFigure?.addEventListener("transitionend", markTransformReady);
    const fallback = window.setTimeout(() => {
      transformReady = true;
      if (!imageReady && targetImage?.complete) markImageReady();
      finish();
    }, reducedMotion ? 0 : 840);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
      targetFigure?.removeEventListener("transitionend", markTransformReady);
      targetImage?.removeEventListener("load", markImageReady);
      targetImage?.removeEventListener("error", markImageFailed);
    };
  }, [failedAssets, locale, onSettled, reducedMotion, requestedStoryId, transitionEpoch]);

  return (
    <div
      className={styles.stage}
      data-requested-story-id={requestedStoryId}
      data-settled-story-id={settledStoryId}
      data-testid="hero-story-stage"
      data-transition-state={transitionState}
    >
      <div className={styles.orbit}>
        {stories.map((story) => {
          const slot = stageSlotFor(stories, story.id, requestedStoryId);
          const active = slot === "front";
          const asset = getStoryAsset(story.screenshotId, locale);
          const assetKey = `${story.id}:${locale}`;
          const failed = failedAssets.has(assetKey);
          return (
            <figure
              className={styles.phone}
              data-slot={slot}
              data-story-id={story.id}
              key={story.id}
              aria-hidden={active ? undefined : true}
              ref={(node) => {
                if (node) figureRefs.current.set(story.id, node);
                else figureRefs.current.delete(story.id);
              }}
            >
              <div className={styles.screen}>
                {failed ? (
                  <div className={styles.imageFailure} role={active ? "img" : undefined} aria-label={active ? text(story.alt) : undefined}>
                    {active ? text(uiCopy.screenshotUnavailable) : null}
                  </div>
                ) : (
                  <img
                    alt={active ? text(story.alt) : ""}
                    aria-hidden={active ? undefined : true}
                    decoding="async"
                    height={asset.height}
                    loading={active ? "eager" : "lazy"}
                    onError={() => setFailedAssets((current) => new Set(current).add(assetKey))}
                    ref={(node) => {
                      if (node) imageRefs.current.set(story.id, node);
                      else imageRefs.current.delete(story.id);
                    }}
                    sizes="(min-width: 1181px) min(22.9167vw, 34.375vh), (max-width: 350px) 194px, (max-width: 520px) 214px, (max-width: 980px) 280px, 356px"
                    src={asset.src}
                    srcSet={asset.srcSet}
                    width={asset.width}
                  />
                )}
              </div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
