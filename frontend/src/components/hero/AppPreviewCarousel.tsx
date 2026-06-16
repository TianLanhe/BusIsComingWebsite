import { useEffect, useMemo, useState } from "react";
import { carouselSlides } from "../../content/carouselSlides";
import type { FeatureShowcaseId } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./AppPreviewCarousel.module.css";
import { ScreenshotStack } from "./ScreenshotStack";

const intervalMs = 4_500;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

interface AppPreviewCarouselProps {
  initialFeatureId?: FeatureShowcaseId;
}

export function AppPreviewCarousel({ initialFeatureId }: AppPreviewCarouselProps) {
  const { text } = useI18n();
  const orderedSlides = useMemo(() => [...carouselSlides].sort((a, b) => a.order - b.order), []);
  const initialIndex = Math.max(
    0,
    orderedSlides.findIndex((slide) => slide.id === initialFeatureId),
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [activeImages, setActiveImages] = useState<Record<string, string>>(() =>
    Object.fromEntries(orderedSlides.map((slide) => [slide.id, slide.gallery.defaultImageId])),
  );
  const activeSlide = orderedSlides[activeIndex];

  useEffect(() => {
    if (isPaused || prefersReducedMotion()) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % orderedSlides.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPaused, orderedSlides.length]);

  function selectImage(imageId: string) {
    // 用户手动查看同组截图时，暂停外层自动轮播，避免刚选图就被切到下一项。
    setIsPaused(true);
    setActiveImages((current) => ({ ...current, [activeSlide.id]: imageId }));
  }

  return (
    <section
      className={styles.carousel}
      aria-label={text(uiCopy.appPreviewCarousel)}
      data-testid="feature-showcase"
      data-paused={isPaused}
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <ScreenshotStack
        gallery={activeSlide.gallery}
        activeImageId={activeImages[activeSlide.id] ?? activeSlide.gallery.defaultImageId}
        onSelectImage={selectImage}
      />

      <div className={styles.copy} data-testid="active-slide" data-slide-id={activeSlide.id}>
        <p className={styles.order}>{String(activeSlide.order).padStart(2, "0")}</p>
        <h2>{text(activeSlide.title)}</h2>
        <p>{text(activeSlide.description)}</p>

        <div className={styles.dots} aria-label={text(uiCopy.carouselPagination)}>
          {orderedSlides.map((slide, index) => (
            <span
              key={slide.id}
              className={index === activeIndex ? styles.activeDot : styles.dot}
              aria-label={`${text(uiCopy.slideLabelPrefix)} ${slide.order}`}
              aria-current={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
