import { useRef } from "react";
import type { KeyboardEvent } from "react";
import type { HeroStory, HeroStoryId } from "../../content/types";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./HeroStoryRail.module.css";

export function HeroStoryRail({
  stories,
  activeStoryId,
  onSelect,
}: {
  stories: HeroStory[];
  activeStoryId: HeroStoryId;
  onSelect: (storyId: HeroStoryId) => void;
}) {
  const { text } = useI18n();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const activeStory = stories.find((story) => story.id === activeStoryId) ?? stories[0];

  function moveFrom(index: number, event: KeyboardEvent<HTMLButtonElement>) {
    let target = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") target = (index + 1) % stories.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp") target = (index - 1 + stories.length) % stories.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = stories.length - 1;
    else return;
    event.preventDefault();
    onSelect(stories[target].id);
    buttonRefs.current[target]?.focus();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.rail} role="group" aria-label={text({ "zh-Hant": "五個功能故事", "zh-Hans": "五个功能故事", en: "Five product stories" })}>
        <span className={styles.track} aria-hidden="true" />
        {stories.map((story, index) => {
          const selected = story.id === activeStoryId;
          return (
            <button
              aria-pressed={selected}
              className={styles.story}
              data-active={selected ? "true" : "false"}
              data-story-id={story.id}
              key={story.id}
              onClick={() => onSelect(story.id)}
              onKeyDown={(event) => moveFrom(index, event)}
              ref={(node) => { buttonRefs.current[index] = node; }}
              tabIndex={selected ? 0 : -1}
              type="button"
            >
              <span className={styles.number}>{story.numberLabel}</span>
              <span className={styles.label}>{text(story.shortLabel)}</span>
            </button>
          );
        })}
      </div>
      <p className={styles.live} aria-live="polite" aria-atomic="true">
        {text(activeStory.title)}。{text(activeStory.description)}
      </p>
    </div>
  );
}
