import type { ScreenshotGallery } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./ScreenshotStack.module.css";

interface ScreenshotStackProps {
  gallery: ScreenshotGallery;
  activeImageId: string;
  onSelectImage: (imageId: string) => void;
}

export function ScreenshotStack({ gallery, activeImageId, onSelectImage }: ScreenshotStackProps) {
  const { text } = useI18n();
  const orderedImages = [...gallery.images].sort((a, b) => a.order - b.order);
  const activeImage = orderedImages.find((image) => image.id === activeImageId) ?? orderedImages[0];
  const inactiveImages = orderedImages.filter((image) => image.id !== activeImage.id).slice(0, 2);
  const hasDeck = orderedImages.length > 1;

  return (
    <div
      className={styles.rail}
      data-testid="screenshot-rail"
      data-active-image-id={activeImage.id}
      data-visual-mode={gallery.visualMode}
    >
      {hasDeck
        ? inactiveImages.map((image, index) => (
            <div
              key={image.id}
              className={`${styles.card} ${index === 0 ? styles.backLeft : styles.backRight}`}
              data-testid="screenshot-deck-card"
              data-image-id={image.id}
            >
              <img src={image.src} alt="" aria-hidden="true" />
            </div>
          ))
        : null}

      <div className={`${styles.card} ${styles.mainImage}`} data-testid="screenshot-deck-main">
        <img src={activeImage.src} alt={text(activeImage.alt)} />
      </div>

      {hasDeck
        ? inactiveImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={`${styles.hitArea} ${index === 0 ? styles.hitLeft : styles.hitRight}`}
              data-image-id={image.id}
              aria-label={`${text(uiCopy.sameSceneScreenshotPrefix)} ${image.order}`}
              onClick={() => onSelectImage(image.id)}
            />
          ))
        : null}
    </div>
  );
}
