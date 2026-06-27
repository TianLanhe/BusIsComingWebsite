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
  const hitAreaPointerStartX = useRef<number | null>(null);
  const skipHitAreaClickRef = useRef(false);
  const skipClickRef = useRef(false);
  const openLightboxOnTapRef = useRef(false);
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
    openLightboxOnTapRef.current =
      event.target instanceof HTMLElement && Boolean(event.target.closest('[data-testid="screenshot-deck-main"]'));
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (pointerStartX.current === null) {
      return;
    }

    const deltaX = event.clientX - pointerStartX.current;
    const shouldOpenLightbox = openLightboxOnTapRef.current;
    pointerStartX.current = null;
    openLightboxOnTapRef.current = false;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (Math.abs(deltaX) >= dragThresholdPx && hasDeck) {
      skipClickRef.current = true;
      // 截图区拖动只切换同一功能内截图，不能冒泡成整个功能轮播切换。
      event.preventDefault();
      event.stopPropagation();
      onMoveImage(deltaX < 0 ? 1 : -1);
      return;
    }

    if (shouldOpenLightbox) {
      event.preventDefault();
      event.stopPropagation();
      onOpenLightbox();
    }
  }

  function handleHitAreaPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    hitAreaPointerStartX.current = event.clientX;
    skipHitAreaClickRef.current = false;
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handleHitAreaPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (hitAreaPointerStartX.current === null) {
      return;
    }

    const deltaX = event.clientX - hitAreaPointerStartX.current;
    hitAreaPointerStartX.current = null;
    event.stopPropagation();
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (Math.abs(deltaX) >= dragThresholdPx && hasDeck) {
      skipHitAreaClickRef.current = true;
      window.setTimeout(() => {
        skipHitAreaClickRef.current = false;
      }, 0);
      // 折叠图片区域拖动同样只切同功能截图，不能触发功能轮播。
      event.preventDefault();
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
        openLightboxOnTapRef.current = false;
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
              onPointerDown={handleHitAreaPointerDown}
              onPointerUp={handleHitAreaPointerUp}
              onPointerCancel={(event) => {
                hitAreaPointerStartX.current = null;
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                if (skipHitAreaClickRef.current) {
                  skipHitAreaClickRef.current = false;
                  return;
                }
                onSelectImage(image.id);
              }}
            />
          ))
        : null}
    </div>
  );
}
