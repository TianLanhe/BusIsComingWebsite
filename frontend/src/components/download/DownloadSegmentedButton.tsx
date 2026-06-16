import { Download, Smartphone } from "lucide-react";
import { useState } from "react";
import { downloadManifest } from "../../content/downloadManifest";
import type { DownloadPlatform } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSegmentedButton.module.css";

export function DownloadSegmentedButton({ compact = false }: { compact?: boolean }) {
  const { text } = useI18n();
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "failed">("idle");
  const android = downloadManifest.platforms.android;
  const ios = downloadManifest.platforms.ios;

  async function handleAction(platform: DownloadPlatform) {
    if (platform.status !== "available" || !platform.downloadUrl) {
      return;
    }

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

  const detail = downloadState === "downloading" ? text(uiCopy.downloadStarting) : `${text(android.description)} · ${text(android.artifact!.sizeLabel)}`;

  return (
    <div
      className={`${styles.wrap} ${compact ? styles.compact : ""}`}
      data-state="android-ready"
      data-download-status={downloadState}
      data-testid="download-segmented-button"
    >
      <button type="button" className={styles.downloadButton} onClick={() => handleAction(android)}>
        <Smartphone aria-hidden="true" size={28} />
        <span className={styles.copy}>
          <strong>{text(android.actionLabel)}</strong>
          <small>{detail}</small>
        </span>
        <Download aria-hidden="true" size={26} />
      </button>
      <p className={styles.iphoneStatus}>{ios.disabledReason ? text(ios.disabledReason) : text(ios.description)}</p>
      {downloadState === "failed" ? (
        <p className={styles.error} role="status" aria-live="polite">
          {text(uiCopy.downloadFailed)}
        </p>
      ) : null}
    </div>
  );
}
