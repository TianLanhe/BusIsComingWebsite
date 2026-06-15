import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";
import { carouselSlides } from "../../content/carouselSlides";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./AppPreviewCarousel.module.css";

export function AppPreviewCarousel() {
  const { text } = useI18n();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = carouselSlides[activeIndex];

  const orderedSlides = useMemo(() => [...carouselSlides].sort((a, b) => a.order - b.order), []);

  function move(offset: number) {
    setActiveIndex((current) => (current + offset + orderedSlides.length) % orderedSlides.length);
  }

  return (
    <section className={styles.carousel} aria-label={text(uiCopy.appPreviewCarousel)}>
      <div className={styles.phoneFrame}>
        <img src={activeSlide.screenshot} alt={text(activeSlide.title)} />
      </div>

      <div className={styles.copy} data-testid="active-slide" data-slide-id={activeSlide.id}>
        <p className={styles.order}>{String(activeSlide.order).padStart(2, "0")}</p>
        <h2>{text(activeSlide.title)}</h2>
        <p>{text(activeSlide.description)}</p>
        {activeSlide.screenshotStatus === "placeholder" ? (
          <span className={styles.placeholderNote}>
            <ImageOff aria-hidden="true" size={15} />
            {text(uiCopy.temporaryMock)}
          </span>
        ) : null}

        <div className={styles.controls}>
          <button type="button" onClick={() => move(-1)} aria-label={text(uiCopy.previousSlide)}>
            <ChevronLeft aria-hidden="true" size={20} />
          </button>
          <div className={styles.dots} aria-label={text(uiCopy.carouselPagination)}>
            {orderedSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={index === activeIndex ? styles.activeDot : styles.dot}
                onClick={() => setActiveIndex(index)}
                aria-label={`${text(uiCopy.slideLabelPrefix)} ${slide.order}`}
                aria-current={index === activeIndex}
              />
            ))}
          </div>
          <button type="button" onClick={() => move(1)} aria-label="Next slide">
            <ChevronRight aria-hidden="true" size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
