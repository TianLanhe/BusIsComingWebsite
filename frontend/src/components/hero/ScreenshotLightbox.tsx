import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import type { ScreenshotGallery } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./ScreenshotLightbox.module.css";

const minZoom = 1;
const maxZoom = 3;
const zoomStep = 0.25;

interface ScreenshotLightboxProps {
  gallery: ScreenshotGallery;
  activeImageId: string;
  onSelectImage: (imageId: string) => void;
  onClose: () => void;
}

export function ScreenshotLightbox({ gallery, activeImageId, onSelectImage, onClose }: ScreenshotLightboxProps) {
  const { text } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ pointerX: number; pointerY: number; panX: number; panY: number } | null>(null);
  const [zoom, setZoom] = useState(minZoom);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const orderedImages = useMemo(() => [...gallery.images].sort((a, b) => a.order - b.order), [gallery.images]);
  const activeIndex = Math.max(
    0,
    orderedImages.findIndex((image) => image.id === activeImageId),
  );
  const activeImage = orderedImages[activeIndex] ?? orderedImages[0];
  const hasImageSwitching = orderedImages.length > 1;

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  function formatZoom(value: number) {
    return Number(value.toFixed(2)).toString();
  }

  function clampZoom(value: number) {
    return Math.min(maxZoom, Math.max(minZoom, value));
  }

  function updateZoom(nextZoom: number) {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);
    if (clamped === minZoom) {
      setPan({ x: 0, y: 0 });
    }
  }

  function moveImage(direction: 1 | -1) {
    if (!hasImageSwitching) {
      return;
    }
    const nextIndex = (activeIndex + direction + orderedImages.length) % orderedImages.length;
    setZoom(minZoom);
    setPan({ x: 0, y: 0 });
    onSelectImage(orderedImages[nextIndex].id);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    updateZoom(zoom + (event.deltaY < 0 ? zoomStep : -zoomStep));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (zoom <= minZoom) {
      return;
    }
    // 放大后优先平移当前截图，避免用户查看细节时被误判成同功能切图。
    panStartRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = panStartRef.current;
    if (!start) {
      return;
    }
    setPan({
      x: start.panX + event.clientX - start.pointerX,
      y: start.panY + event.clientY - start.pointerY,
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    panStartRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={text(uiCopy.screenshotLightboxTitle)}
        tabIndex={-1}
        data-testid="screenshot-lightbox"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            moveImage(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            moveImage(-1);
          }
        }}
      >
        <div className={styles.toolbar}>
          <span className={styles.title}>{text(activeImage.alt)}</span>
          <div className={styles.actions}>
            <button type="button" onClick={() => updateZoom(zoom + zoomStep)}>
              {text(uiCopy.zoomInScreenshot)}
            </button>
            <button type="button" onClick={() => updateZoom(zoom - zoomStep)}>
              {text(uiCopy.zoomOutScreenshot)}
            </button>
            <button type="button" onClick={() => updateZoom(minZoom)}>
              {text(uiCopy.resetScreenshotZoom)}
            </button>
            <button type="button" className={styles.closeButton} onClick={onClose}>
              {text(uiCopy.closeLightbox)}
            </button>
          </div>
        </div>

        <div
          className={styles.viewport}
          data-zoomed={zoom > minZoom}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => {
            panStartRef.current = null;
          }}
        >
          <img
            src={activeImage.src}
            alt={text(activeImage.alt)}
            data-testid="lightbox-image"
            data-image-id={activeImage.id}
            data-zoom={formatZoom(zoom)}
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          />
        </div>

        {hasImageSwitching ? (
          <div className={styles.imageNav} aria-label={text(uiCopy.screenshotLightboxTitle)}>
            <button type="button" onClick={() => moveImage(-1)}>
              {text(uiCopy.previousScreenshot)}
            </button>
            <span>
              {activeIndex + 1} / {orderedImages.length}
            </span>
            <button type="button" onClick={() => moveImage(1)}>
              {text(uiCopy.nextScreenshot)}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
