import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { ScreenshotGallery } from "../../content/types";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./ScreenshotStack.module.css";

interface ScreenshotStackProps {
  gallery: ScreenshotGallery;
  activeImageId: string;
  onSelectImage: (imageId: string) => void;
}

export function ScreenshotStack({ gallery, activeImageId, onSelectImage }: ScreenshotStackProps) {
  const { text } = useI18n();
  const orderedImages = useMemo(() => [...gallery.images].sort((a, b) => a.order - b.order), [gallery.images]);
  const activeImage = orderedImages.find((image) => image.id === activeImageId) ?? orderedImages[0];
  const stackedImages = orderedImages.filter((image) => image.id !== activeImage.id);
  const showStack = orderedImages.length > 1 && gallery.hideStackWhenSingleImage;

  return (
    <div className={styles.stack} data-testid="screenshot-stack" data-active-image-id={activeImage.id}>
      <div className={styles.mainImage}>
        <img src={activeImage.src} alt={text(activeImage.alt)} />
      </div>

      {showStack ? (
        <div className={styles.thumbnails} data-testid="screenshot-stack-thumbnails">
          {stackedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              className={styles.thumbnail}
              style={{ "--stack-index": index } as CSSProperties}
              onClick={() => onSelectImage(image.id)}
              aria-label={text(image.alt)}
            >
              <img src={image.src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
