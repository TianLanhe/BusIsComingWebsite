import type { ScreenshotGallery } from "../../content/types";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./ScreenshotStack.module.css";

interface ScreenshotStackProps {
  gallery: ScreenshotGallery;
  activeImageId: string;
}

export function ScreenshotStack({ gallery, activeImageId }: ScreenshotStackProps) {
  const { text } = useI18n();
  const orderedImages = [...gallery.images].sort((a, b) => a.order - b.order);
  const activeImage = orderedImages.find((image) => image.id === activeImageId) ?? orderedImages[0];
  const activeIndex = orderedImages.findIndex((image) => image.id === activeImage.id);
  const previousImage = activeIndex > 0 ? orderedImages[activeIndex - 1] : null;
  const nextImage = activeIndex < orderedImages.length - 1 ? orderedImages[activeIndex + 1] : null;

  return (
    <div
      className={styles.rail}
      data-testid="screenshot-rail"
      data-active-image-id={activeImage.id}
      data-visual-mode={gallery.visualMode}
    >
      {previousImage ? (
        <div className={`${styles.preview} ${styles.previous}`} aria-hidden="true" data-testid="screenshot-rail-preview">
          <img src={previousImage.src} alt="" />
        </div>
      ) : null}

      <div className={styles.mainImage}>
        <img src={activeImage.src} alt={text(activeImage.alt)} />
      </div>

      {nextImage ? (
        <div className={`${styles.preview} ${styles.next}`} aria-hidden="true" data-testid="screenshot-rail-preview">
          <img src={nextImage.src} alt="" />
        </div>
      ) : null}
    </div>
  );
}
