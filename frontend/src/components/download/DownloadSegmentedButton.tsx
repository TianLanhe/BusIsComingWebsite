import { Apple, Download, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { downloadManifest } from "../../content/downloadManifest";
import type { DownloadButtonState, DownloadPlatform } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSegmentedButton.module.css";

const stateByPlatform = {
  android: "android-expanded",
  ios: "iphone-expanded",
} as const;

export function DownloadSegmentedButton({ compact = false }: { compact?: boolean }) {
  const { text } = useI18n();
  const [state, setState] = useState<DownloadButtonState>("default");
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "failed">("idle");
  const hoverTimerRef = useRef<number | null>(null);

  const android = downloadManifest.platforms.android;
  const ios = downloadManifest.platforms.ios;
  const active = state === "iphone-expanded" ? ios : android;
  const isExpanded = state !== "default";

  function clearHoverTimer() {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }

  useEffect(() => clearHoverTimer, []);

  function activate(platform: DownloadPlatform) {
    clearHoverTimer();
    setState(stateByPlatform[platform.platform]);
  }

  function activateAfterPreviewDelay(platform: DownloadPlatform) {
    clearHoverTimer();
    hoverTimerRef.current = window.setTimeout(() => activate(platform), 80);
  }

  async function handleAction(platform: DownloadPlatform) {
    activate(platform);
    if (platform.status === "available" && platform.downloadUrl) {
      setDownloadState("downloading");
      try {
        const response = await fetch(platform.downloadUrl, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Download failed with ${response.status}`);
        }
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = platform.artifact?.fileName ?? "BusIsComing.apk";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(objectUrl);
        setDownloadState("idle");
      } catch {
        setDownloadState("failed");
      }
    }
  }

  function detailFor(platform: DownloadPlatform) {
    if (platform.platform === "android" && downloadState === "downloading") {
      return text(uiCopy.downloadStarting);
    }
    if (platform.platform === "android" && downloadState === "failed") {
      return text(uiCopy.downloadFailed);
    }
    if (platform.artifact) {
      return `${text(platform.description)} · ${text(platform.artifact.sizeLabel)}`;
    }
    return platform.disabledReason ? text(platform.disabledReason) : text(platform.description);
  }

  return (
    <div
      className={`${styles.wrap} ${compact ? styles.compact : ""}`}
      onMouseLeave={() => {
        clearHoverTimer();
        setState("default");
      }}
      data-state={state}
      data-download-status={downloadState}
      data-testid="download-segmented-button"
    >
      {!isExpanded ? (
        <div className={styles.defaultState} aria-label={text(uiCopy.downloadAppLabel)}>
          <button
            type="button"
            className={styles.segment}
            onMouseEnter={() => activateAfterPreviewDelay(android)}
            onFocus={() => activateAfterPreviewDelay(android)}
            onClick={() => handleAction(android)}
          >
            <Smartphone aria-hidden="true" size={30} />
            <span>
              <strong>{text(android.label)}</strong>
              <small>{text(android.description)}</small>
            </span>
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <button
            type="button"
            className={styles.segment}
            onMouseEnter={() => activateAfterPreviewDelay(ios)}
            onFocus={() => activateAfterPreviewDelay(ios)}
            onClick={(event) => {
              event.preventDefault();
              handleAction(ios);
            }}
          >
            <Apple aria-hidden="true" size={30} />
            <span>
              <strong>{text(ios.label)}</strong>
              <small>{text(ios.description)}</small>
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.expanded} ${active.platform === "ios" ? styles.ios : styles.android}`}
          onMouseEnter={() => activate(active)}
          onFocus={() => activate(active)}
          onClick={(event) => {
            event.preventDefault();
            handleAction(active);
          }}
          aria-disabled={active.status !== "available"}
          data-testid="download-expanded"
        >
          {active.platform === "ios" ? <Apple aria-hidden="true" size={36} /> : <Smartphone aria-hidden="true" size={36} />}
          <span className={styles.expandedCopy}>
            <strong>{text(active.actionLabel)}</strong>
            <small>{detailFor(active)}</small>
          </span>
          {active.status === "available" ? <Download aria-hidden="true" size={32} /> : <span className={styles.blocked}>!</span>}
        </button>
      )}
      {downloadState === "failed" ? (
        <p className={styles.error} role="status" aria-live="polite">
          {text(uiCopy.downloadFailed)}
        </p>
      ) : null}
    </div>
  );
}
