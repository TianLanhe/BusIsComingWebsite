import { useState } from "react";
import { homepageContent } from "../../content/homepageContent";
import type { HeroStoryId } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { WindField } from "../homepage/WindField";
import { AndroidDownloadAction } from "../download/AndroidDownloadAction";
import { DownloadMetadataLine } from "../download/DownloadMetadataLine";
import { useI18n } from "../i18n/I18nProvider";
import { HeroStoryRail } from "./HeroStoryRail";
import { HeroStoryStage } from "./HeroStoryStage";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  const { locale, text } = useI18n();
  const stories = homepageContent.hero.stories;
  const [activeStoryId, setActiveStoryId] = useState<HeroStoryId>("route-search");
  const activeStory = stories.find((story) => story.id === activeStoryId) ?? stories[0];

  return (
    <section id="features" className={styles.hero} data-active-story={activeStoryId}>
      <span id="hero" className={styles.anchor} aria-hidden="true" />
      <WindField intensity="hero" />
      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            {text(homepageContent.hero.eyebrow)}
          </p>
          <h1 data-testid="hero-title">
            {activeStory.lineBreakHints[locale].map((line) => <span key={line}>{line}</span>)}
          </h1>
          <p className={styles.description}>{text(activeStory.description)}{locale === "en" ? "" : "。"}</p>
          <div className={styles.actions}>
            <AndroidDownloadAction appearance="hero" readyLabel={homepageContent.hero.primaryAction.label} />
            <a className={styles.secondaryAction} href={homepageContent.hero.secondaryAction.target}>
              {text(homepageContent.hero.secondaryAction.label)}
            </a>
          </div>
          <DownloadMetadataLine compact />
        </div>

        <div className={styles.visual}>
          <HeroStoryStage stories={stories} activeStoryId={activeStoryId} />
          <aside className={styles.contextNote} aria-hidden="true">
            <small>{activeStoryId === "cross-operator-arrivals"
              ? text(uiCopy.heroArrivalContextLabel)
              : text(uiCopy.heroJourneyContextLabel)}</small>
            <strong>{activeStoryId === "cross-operator-arrivals"
              ? text(uiCopy.heroArrivalSummary)
              : text(uiCopy.heroRouteSummary)}</strong>
            <span>{text(activeStory.description)}</span>
          </aside>
        </div>

        <HeroStoryRail stories={stories} activeStoryId={activeStoryId} onSelect={setActiveStoryId} />
      </div>
    </section>
  );
}
