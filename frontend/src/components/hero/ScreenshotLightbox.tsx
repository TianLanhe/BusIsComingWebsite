import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent, WheelEvent } from "react";
import type { ScreenshotGallery } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./ScreenshotLightbox.module.css";

const minZoom = 1;
const maxZoom = 3;
const zoomStep = 0.25;
const swipeThresholdPx = 48;

type PointerPoint = {
  x: number;
  y: number;
};

type GestureState =
  | { type: "swipe"; pointerId: number; startX: number; startY: number }
  | { type: "pan"; pointerId: number; pointerX: number; pointerY: number; panX: number; panY: number }
  | { type: "pinch"; distance: number; zoom: number };

interface ScreenshotLightboxProps {
  gallery: ScreenshotGallery;
  activeImageId: string;
  onSelectImage: (imageId: string) => void;
  onClose: () => void;
}

export function ScreenshotLightbox({ gallery, activeImageId, onSelectImage, onClose }: ScreenshotLightboxProps) {
  const { text } = useI18n();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const activePointersRef = useRef<Map<number, PointerPoint>>(new Map());
  const gestureRef = useRef<GestureState | null>(null);
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

  function pointFromEvent(event: PointerEvent<HTMLDivElement>): PointerPoint {
    return { x: event.clientX, y: event.clientY };
  }

  function distanceBetween(a: PointerPoint, b: PointerPoint) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function currentPinchDistance() {
    const points = Array.from(activePointersRef.current.values());
    if (points.length < 2) {
      return null;
    }
    return distanceBetween(points[0], points[1]);
  }

  function beginSinglePointerGesture(event: PointerEvent<HTMLDivElement>) {
    if (zoom > minZoom) {
      // 放大后优先平移当前截图，避免用户查看细节时被误判成同功能切图。
      gestureRef.current = {
        type: "pan",
        pointerId: event.pointerId,
        pointerX: event.clientX,
        pointerY: event.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      return;
    }

    gestureRef.current = {
      type: "swipe",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
  }

  function beginPinchGesture() {
    const distance = currentPinchDistance();
    if (!distance) {
      return;
    }
    gestureRef.current = { type: "pinch", distance, zoom };
  }

  function setPointerCaptureSafely(target: HTMLDivElement, pointerId: number) {
    try {
      target.setPointerCapture?.(pointerId);
    } catch {
      // 浏览器合成触控事件可能没有真实 active pointer；忽略即可，手势状态仍由本组件维护。
    }
  }

  function releasePointerCaptureSafely(target: HTMLDivElement, pointerId: number) {
    try {
      target.releasePointerCapture?.(pointerId);
    } catch {
      // 与 setPointerCaptureSafely 对称，避免合成事件在测试环境中抛错。
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
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    activePointersRef.current.set(event.pointerId, pointFromEvent(event));
    setPointerCaptureSafely(event.currentTarget, event.pointerId);

    if (activePointersRef.current.size >= 2) {
      beginPinchGesture();
      return;
    }

    beginSinglePointerGesture(event);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!activePointersRef.current.has(event.pointerId)) {
      return;
    }

    activePointersRef.current.set(event.pointerId, pointFromEvent(event));
    const gesture = gestureRef.current;
    if (!gesture) {
      return;
    }

    if (gesture.type === "pinch") {
      const distance = currentPinchDistance();
      if (!distance) {
        return;
      }
      updateZoom(gesture.zoom * (distance / gesture.distance));
    }

    if (gesture.type === "pan" && gesture.pointerId === event.pointerId) {
      setPan({
        x: gesture.panX + event.clientX - gesture.pointerX,
        y: gesture.panY + event.clientY - gesture.pointerY,
      });
    }
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (gesture?.type === "swipe" && gesture.pointerId === event.pointerId) {
      const deltaX = event.clientX - gesture.startX;
      const deltaY = event.clientY - gesture.startY;
      if (Math.abs(deltaX) >= swipeThresholdPx && Math.abs(deltaX) > Math.abs(deltaY)) {
        moveImage(deltaX < 0 ? 1 : -1);
      }
    }

    activePointersRef.current.delete(event.pointerId);
    gestureRef.current = null;
    releasePointerCaptureSafely(event.currentTarget, event.pointerId);
  }

  function handlePointerCancel(event: PointerEvent<HTMLDivElement>) {
    activePointersRef.current.delete(event.pointerId);
    gestureRef.current = null;
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
        className={styles.overlay}
        role="dialog"
        aria-modal="true"
        aria-label={text(uiCopy.screenshotLightboxTitle)}
        tabIndex={-1}
        data-testid="screenshot-lightbox"
        data-ui-mode="minimal-image-overlay"
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
        <button type="button" className={styles.closeButton} aria-label={text(uiCopy.closeLightbox)} onClick={onClose}>
          <span aria-hidden="true">×</span>
        </button>

        <div
          className={styles.viewport}
          data-testid="lightbox-viewport"
          data-zoomed={zoom > minZoom}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
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
          <span className={styles.pageIndicator} data-testid="lightbox-page-indicator" aria-live="polite">
            {activeIndex + 1} / {orderedImages.length}
          </span>
        ) : null}
      </div>
    </div>
  );
}
