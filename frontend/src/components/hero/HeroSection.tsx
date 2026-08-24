import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { homepageContent } from "../../content/homepageContent";
import { uiCopy } from "../../content/uiCopy";
import type { HeroStoryId } from "../../content/types";
import { useHeroStoryController } from "../../hooks/useHeroStoryController";
import { useDesktopViewport } from "../../hooks/useDesktopViewport";
import { useKeyboardFocusPause } from "../../hooks/useKeyboardFocusPause";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { AppBrand } from "../brand/AppBrand";
import { AndroidDownloadAction } from "../download/AndroidDownloadAction";
import { DownloadMetadataLine } from "../download/DownloadMetadataLine";
import { WindField } from "../homepage/WindField";
import { InlineLanguageLinks } from "../i18n/InlineLanguageLinks";
import { useI18n } from "../i18n/I18nProvider";
import { HeroStoryRail } from "./HeroStoryRail";
import { HeroStoryStage } from "./HeroStoryStage";
import styles from "./HeroSection.module.css";

interface StoryCopySnapshot {
  locale: "zh-Hant" | "zh-Hans" | "en";
  storyId: HeroStoryId;
}

export function HeroSection() {
  const { locale, text } = useI18n();
  const reducedMotion = useReducedMotion();
  const desktopViewport = useDesktopViewport();
  const stories = homepageContent.hero.stories;
  const storyIds = useMemo(() => stories.map((story) => story.id), [stories]);
  const controller = useHeroStoryController({ storyIds, locale });
  const sectionRef = useRef<HTMLElement>(null);
  const focusPauseHandlers = useKeyboardFocusPause(
    sectionRef,
    useCallback((paused: boolean) => controller.setPauseReason("focus", paused), [controller.setPauseReason]),
  );
  const [displayCopy, setDisplayCopy] = useState<StoryCopySnapshot>(() => ({ locale, storyId: controller.requestedStoryId }));
  const [exitingCopy, setExitingCopy] = useState<StoryCopySnapshot | null>(null);
  const displayCopyRef = useRef(displayCopy);
  const [announcement, setAnnouncement] = useState("");
  const displayStory = stories.find((story) => story.id === displayCopy.storyId) ?? stories[0];
  const exitingStory = exitingCopy
    ? stories.find((story) => story.id === exitingCopy.storyId) ?? stories[0]
    : null;

  useEffect(() => {
    const target: StoryCopySnapshot = { locale, storyId: controller.requestedStoryId };
    const current = displayCopyRef.current;
    if (current.locale === target.locale && current.storyId === target.storyId) return;
    if (reducedMotion) {
      displayCopyRef.current = target;
      setExitingCopy(null);
      setDisplayCopy(target);
      return;
    }
    let exitTimer = 0;
    // 舞台先开始换位；文案保留 160ms 阅读锚点后，旧文案上退、新文案由下方进入。
    // 快速选择会清除旧 timer，并只让最新 epoch 对应的目标文案进入。
    const followTimer = window.setTimeout(() => {
      const previous = displayCopyRef.current;
      displayCopyRef.current = target;
      setExitingCopy(previous);
      setDisplayCopy(target);
      exitTimer = window.setTimeout(() => setExitingCopy(null), 240);
    }, 160);
    return () => {
      window.clearTimeout(followTimer);
      window.clearTimeout(exitTimer);
    };
  }, [controller.requestedStoryId, controller.transitionEpoch, locale, reducedMotion]);

  useEffect(() => {
    const updateHidden = () => controller.setPauseReason("hidden", document.visibilityState === "hidden");
    updateHidden();
    document.addEventListener("visibilitychange", updateHidden);
    return () => document.removeEventListener("visibilitychange", updateHidden);
  }, [controller.setPauseReason]);

  useEffect(() => {
    controller.setPauseReason("reduced-motion", reducedMotion);
  }, [controller.setPauseReason, reducedMotion]);

  useEffect(() => {
    if (!window.IntersectionObserver || !sectionRef.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      controller.setPauseReason("offscreen", !entry?.isIntersecting || entry.intersectionRatio < .42);
    }, { threshold: [.42] });
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [controller.setPauseReason]);

  useEffect(() => {
    const root = document.documentElement;
    const update = () => controller.setPauseReason("visual-review", root.dataset.visualPaused === "true");
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["data-visual-paused"] });
    return () => observer.disconnect();
  }, [controller.setPauseReason]);

  const selectStory = useCallback((storyId: HeroStoryId) => {
    setAnnouncement("");
    controller.selectStory(storyId, "manual");
  }, [controller.selectStory]);

  const markSettled = useCallback((storyId: HeroStoryId, epoch: number) => {
    controller.markSettled(storyId, epoch);
    if (controller.selectionOrigin === "manual" && epoch === controller.transitionEpoch) {
      const story = stories.find((candidate) => candidate.id === storyId);
      if (story) setAnnouncement(`${text(story.title)}。${text(story.description)}`);
    }
  }, [controller.markSettled, controller.selectionOrigin, controller.transitionEpoch, stories, text]);

  return (
    <section
      id="features"
      className={styles.hero}
      data-active-story={controller.requestedStoryId}
      onFocusCapture={focusPauseHandlers.onFocusCapture}
      onBlurCapture={focusPauseHandlers.onBlurCapture}
      onMouseEnter={() => controller.setPauseReason("hover", true)}
      onMouseLeave={() => controller.setPauseReason("hover", false)}
      ref={sectionRef}
    >
      <span id="hero" className={styles.anchor} aria-hidden="true" />
      <WindField intensity="hero" />
      <div className={styles.inner}>
        <div className={styles.chrome}>
          <AppBrand compact />
          <InlineLanguageLinks />
        </div>

        <div className={styles.copy} data-copy-locale={locale}>
          <p className={styles.eyebrow}>
            <span aria-hidden="true" />
            {text(homepageContent.hero.eyebrow)}
          </p>
          <div className={styles.storyCopyViewport}>
            {exitingStory && exitingCopy ? (
              <div
                aria-hidden="true"
                className={`${styles.storyCopy} ${styles.storyCopyExit}`}
                data-copy-phase="exiting"
                data-copy-story-id={exitingCopy.storyId}
              >
                <h1 data-story-id={exitingCopy.storyId} lang={exitingCopy.locale}>
                  {exitingStory.lineBreakHints[exitingCopy.locale].map((line) => <span key={line}>{line}</span>)}
                </h1>
                <p className={styles.description} lang={exitingCopy.locale}>
                  {exitingStory.description[exitingCopy.locale]}
                </p>
              </div>
            ) : null}
            <div
              className={`${styles.storyCopy} ${exitingCopy ? styles.storyCopyEnter : ""}`}
              data-copy-phase={exitingCopy ? "entering" : "settled"}
              data-copy-story-id={displayCopy.storyId}
              key={`${displayCopy.locale}:${displayCopy.storyId}:${controller.transitionEpoch}`}
            >
              <h1 data-story-id={displayCopy.storyId} data-testid="hero-title" lang={displayCopy.locale}>
                {displayStory.lineBreakHints[displayCopy.locale].map((line) => <span key={line}>{line}</span>)}
              </h1>
              <p className={styles.description} lang={displayCopy.locale}>
                {displayStory.description[displayCopy.locale]}
              </p>
            </div>
          </div>
          <div className={styles.actions}>
            <AndroidDownloadAction
              appearance="hero"
              readyLabel={!desktopViewport && locale === "en" ? uiCopy.downloadAppLabel : homepageContent.hero.primaryAction.label}
            />
            <a className={styles.secondaryAction} href={homepageContent.hero.secondaryAction.target}>
              {text(desktopViewport ? homepageContent.hero.secondaryAction.label : uiCopy.heroMobileRouteAction)}
            </a>
          </div>
          <DownloadMetadataLine compact />
        </div>

        <div className={styles.visual}>
          <HeroStoryStage
            stories={stories}
            requestedStoryId={controller.requestedStoryId}
            settledStoryId={controller.settledStoryId}
            transitionEpoch={controller.transitionEpoch}
            onSettled={markSettled}
          />
          <aside className={styles.contextNote} aria-hidden="true">
            <small lang={locale}>{displayCopy.storyId === "cross-operator-arrivals"
              ? text(uiCopy.heroArrivalContextLabel)
              : text(uiCopy.heroJourneyContextLabel)}</small>
            <strong lang={locale}>{displayCopy.storyId === "cross-operator-arrivals"
              ? text(uiCopy.heroArrivalSummary)
              : text(uiCopy.heroRouteSummary)}</strong>
            <span lang={locale}>{text(displayStory.description)}</span>
          </aside>
        </div>

        <HeroStoryRail
          stories={stories}
          activeStoryId={controller.requestedStoryId}
          announcement={announcement}
          onSelect={selectStory}
        />
      </div>
    </section>
  );
}
