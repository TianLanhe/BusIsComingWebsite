import { useRef } from "react";
import type { PointerEvent } from "react";
import type { ScreenshotGallery } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./ScreenshotStack.module.css";

const dragThresholdPx = 40;

interface ScreenshotStackProps {
  gallery: ScreenshotGallery;
  activeImageId: string;
  onSelectImage: (imageId: string) => void;
  onMoveImage: (direction: 1 | -1) => void;
  onOpenLightbox: () => void;
}

export function ScreenshotStack({ gallery, activeImageId, onSelectImage, onMoveImage, onOpenLightbox }: ScreenshotStackProps) {
  const { text } = useI18n();
  const pointerStartX = useRef<number | null>(null);
  const skipClickRef = useRef(false);
  const orderedImages = [...gallery.images].sort((a, b) => a.order - b.order);
  const activeImage = orderedImages.find((image) => image.id === activeImageId) ?? orderedImages[0];
  const inactiveImages = orderedImages.filter((image) => image.id !== activeImage.id).slice(0, 2);
  const hasDeck = orderedImages.length > 1;

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    pointerStartX.current = event.clientX;
    skipClickRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) {
      return;
    }

    const deltaX = event.clientX - pointerStartX.current;
    pointerStartX.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (Math.abs(deltaX) >= dragThresholdPx && hasDeck) {
      skipClickRef.current = true;
      // 截图区拖动只切换同一功能内截图，不能冒泡成整个功能轮播切换。
      event.preventDefault();
      event.stopPropagation();
      onMoveImage(deltaX < 0 ? 1 : -1);
    }
  }

  return (
    <div
      className={styles.rail}
      data-testid="screenshot-rail"
      data-active-image-id={activeImage.id}
      data-visual-mode={gallery.visualMode}
      data-gesture-zone="screenshot"
      data-image-count={orderedImages.length}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
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

      <button
        type="button"
        className={`${styles.card} ${styles.mainImage}`}
        data-testid="screenshot-deck-main"
        aria-haspopup="dialog"
        onClick={() => {
          if (skipClickRef.current) {
            skipClickRef.current = false;
            return;
          }
          onOpenLightbox();
        }}
      >
        <img src={activeImage.src} alt={text(activeImage.alt)} />
      </button>

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
