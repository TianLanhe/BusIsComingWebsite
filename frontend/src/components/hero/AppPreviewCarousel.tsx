import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { carouselSlides } from "../../content/carouselSlides";
import type { FeatureShowcaseId } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./AppPreviewCarousel.module.css";
import { ScreenshotStack } from "./ScreenshotStack";

const intervalMs = 3_000;
const dragThresholdPx = 44;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

interface AppPreviewCarouselProps {
  initialFeatureId?: FeatureShowcaseId;
}

export function AppPreviewCarousel({ initialFeatureId }: AppPreviewCarouselProps) {
  const { text } = useI18n();
  const orderedSlides = useMemo(() => [...carouselSlides].sort((a, b) => a.order - b.order), []);
  const pointerStartX = useRef<number | null>(null);
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
  const activeImageId = activeImages[activeSlide.id] ?? activeSlide.gallery.defaultImageId;

  useEffect(() => {
    if (isPaused || prefersReducedMotion()) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % orderedSlides.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [isPaused, orderedSlides.length]);

  function moveFeature(direction: 1 | -1) {
    setActiveIndex((current) => (current + direction + orderedSlides.length) % orderedSlides.length);
  }

  function moveGalleryImage(direction: 1 | -1) {
    const orderedImages = [...activeSlide.gallery.images].sort((a, b) => a.order - b.order);
    const currentIndex = Math.max(
      0,
      orderedImages.findIndex((image) => image.id === activeImageId),
    );
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= orderedImages.length) {
      return false;
    }

    setActiveImages((current) => ({ ...current, [activeSlide.id]: orderedImages[nextIndex].id }));
    return true;
  }

  function navigateDrag(direction: 1 | -1) {
    setIsPaused(true);
    if (!moveGalleryImage(direction)) {
      moveFeature(direction);
    }
  }

  function navigateFeature(direction: 1 | -1) {
    setIsPaused(true);
    moveFeature(direction);
  }

  function handlePointerDown(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerStartX.current = event.clientX;
    setIsPaused(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLElement>) {
    if (pointerStartX.current === null) {
      return;
    }

    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (Math.abs(deltaX) >= dragThresholdPx) {
      navigateDrag(deltaX < 0 ? 1 : -1);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    // 键盘和读屏用户通过方向键或隐藏按钮切换；视觉上不引入常驻箭头控件。
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      navigateFeature(1);
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      navigateFeature(-1);
    }
    if (event.key === "Home") {
      event.preventDefault();
      setIsPaused(true);
      setActiveIndex(0);
    }
    if (event.key === "End") {
      event.preventDefault();
      setIsPaused(true);
      setActiveIndex(orderedSlides.length - 1);
    }
  }

  return (
    <section
      className={styles.carousel}
      aria-label={text(uiCopy.appPreviewCarousel)}
      data-testid="feature-showcase"
      data-paused={isPaused}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
      onPointerEnter={() => setIsPaused(true)}
      onPointerLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <ScreenshotStack
        gallery={activeSlide.gallery}
        activeImageId={activeImageId}
      />

      <div className={styles.copy} data-testid="active-slide" data-slide-id={activeSlide.id}>
        <h2>{text(activeSlide.title)}</h2>
        <p>{text(activeSlide.description)}</p>

        <div className={styles.dots} aria-label={text(uiCopy.carouselPagination)}>
          {orderedSlides.map((slide, index) => (
            <span
              key={slide.id}
              className={index === activeIndex ? styles.activeDot : styles.dot}
              aria-label={`${text(uiCopy.slideLabelPrefix)} ${text(slide.title)}`}
              aria-current={index === activeIndex}
            />
          ))}
        </div>
      </div>

      <div className={styles.accessibleControls}>
        <button type="button" onClick={() => navigateFeature(-1)} data-testid="carousel-previous-feature">
          {text(uiCopy.previousSlide)}
        </button>
        <button type="button" onClick={() => navigateFeature(1)} data-testid="carousel-next-feature">
          {text(uiCopy.nextSlide)}
        </button>
      </div>

      <p className={styles.srStatus} aria-live="polite">
        {text(activeSlide.title)}
      </p>
    </section>
  );
}
