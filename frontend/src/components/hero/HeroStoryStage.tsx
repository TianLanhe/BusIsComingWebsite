import { useEffect, useRef, useState } from "react";
import { storyAssets } from "../../content/storyAssets";
import type { HeroStageSlot, HeroStory, HeroStoryId } from "../../content/types";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./HeroStoryStage.module.css";

const slotByDelta: HeroStageSlot[] = ["front", "near-right", "far-right", "far-left", "near-left"];

export function stageSlotFor(stories: HeroStory[], storyId: HeroStoryId, activeStoryId: HeroStoryId): HeroStageSlot {
  const storyIndex = stories.findIndex((story) => story.id === storyId);
  const activeIndex = stories.findIndex((story) => story.id === activeStoryId);
  return slotByDelta[(storyIndex - activeIndex + stories.length) % stories.length];
}

export function HeroStoryStage({ stories, activeStoryId }: { stories: HeroStory[]; activeStoryId: HeroStoryId }) {
  const { text } = useI18n();
  const reducedMotion = useReducedMotion();
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (reducedMotion) {
      setTransitioning(false);
      return;
    }
    setTransitioning(true);
    timerRef.current = window.setTimeout(() => setTransitioning(false), 900);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [activeStoryId, reducedMotion]);

  return (
    <div
      className={styles.stage}
      data-testid="hero-story-stage"
      data-transitioning={transitioning ? "true" : "false"}
    >
      <div className={styles.orbit}>
        {stories.map((story) => {
          const slot = stageSlotFor(stories, story.id, activeStoryId);
          const active = slot === "front";
          const asset = storyAssets[story.screenshotId];
          const priorityAttribute = { fetchpriority: active ? "high" : "auto" };
          return (
            <figure
              className={styles.phone}
              data-slot={slot}
              data-story-id={story.id}
              key={story.id}
              aria-hidden={active ? undefined : true}
            >
              <div className={styles.screen}>
                <img
                  {...priorityAttribute}
                  alt={active ? text(story.alt) : ""}
                  aria-hidden={active ? undefined : true}
                  decoding="async"
                  height={asset.height}
                  loading={active ? "eager" : "lazy"}
                  sizes="(max-width: 520px) 214px, (max-width: 980px) 280px, 356px"
                  src={asset.src}
                  srcSet={asset.srcSet}
                  width={asset.width}
                />
              </div>
            </figure>
          );
        })}
      </div>
    </div>
  );
}
