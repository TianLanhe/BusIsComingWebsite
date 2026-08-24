import { homepageContent } from "../../content/homepageContent";
import type { LocalizedString } from "../../content/types";
import { useI18n } from "../i18n/I18nProvider";
import { useDesktopViewport } from "../../hooks/useDesktopViewport";
import { useDownloadMetadata } from "./DownloadMetadataProvider";
import styles from "./AndroidDownloadAction.module.css";

export function AndroidDownloadAction({
  appearance = "section",
  readyLabel,
}: {
  appearance?: "hero" | "section";
  readyLabel?: LocalizedString;
}) {
  const { text } = useI18n();
  const metadataState = useDownloadMetadata();
  const desktopViewport = useDesktopViewport();
  const className = `${styles.action} ${appearance === "hero" ? styles.hero : styles.section}`;

  if (appearance === "hero" && desktopViewport) {
    return (
      <a
        aria-label={text(readyLabel ?? homepageContent.downloadDecision.readyAction)}
        className={className}
        data-download-state="desktop-section-link"
        href="#download"
      >
        <span>{text(readyLabel ?? homepageContent.downloadDecision.readyAction)}</span>
        <span className={styles.arrow} aria-hidden="true">↓</span>
      </a>
    );
  }

  if (metadataState.status === "ready") {
    return (
      <a
        aria-label={text(readyLabel ?? homepageContent.downloadDecision.readyAction)}
        className={className}
        data-download-state="android-ready"
        download={metadataState.metadata.fileName}
        href={metadataState.metadata.downloadUrl}
      >
        <span>{text(readyLabel ?? homepageContent.downloadDecision.readyAction)}</span>
        <span className={styles.arrow} aria-hidden="true">↓</span>
      </a>
    );
  }

  const statusCopy = metadataState.status === "loading"
    ? homepageContent.downloadDecision.checkingState
    : homepageContent.downloadDecision.unavailableState;

  return (
    <button
      className={`${className} ${styles.disabled}`}
      data-download-state={metadataState.status === "loading" ? "android-checking" : "android-unavailable"}
      aria-disabled="true"
      disabled
      type="button"
    >
      <span>{text(statusCopy)}</span>
      <span className={styles.arrow} aria-hidden="true">↓</span>
    </button>
  );
}
