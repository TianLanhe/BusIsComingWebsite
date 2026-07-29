import { useId } from "react";
import { Download, Smartphone } from "lucide-react";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import { useDownloadMetadata, versionAPKMetadataText } from "./DownloadMetadataProvider";
import styles from "./AndroidDownloadAction.module.css";

interface AndroidDownloadActionProps {
  appearance?: "hero" | "section";
}

export function AndroidDownloadAction({ appearance = "section" }: AndroidDownloadActionProps) {
  const { locale, text } = useI18n();
  const metadataState = useDownloadMetadata();
  const className = `${styles.action} ${appearance === "hero" ? styles.hero : ""}`;
  const metadataDescriptionId = useId();

  if (metadataState.status === "ready") {
    return (
      <a
        aria-describedby={metadataDescriptionId}
        aria-label={text(uiCopy.androidDownloadReady)}
        className={className}
        data-download-state="android-ready"
        download={metadataState.metadata.fileName}
        href={metadataState.metadata.downloadUrl}
      >
        <Smartphone aria-hidden="true" size={28} />
        <span className={styles.copy}>
          <strong>{text(uiCopy.androidDownloadReady)}</strong>
          <small id={metadataDescriptionId}>{versionAPKMetadataText(metadataState.metadata, locale)}</small>
        </span>
        <Download aria-hidden="true" size={26} />
      </a>
    );
  }

  const statusCopy = metadataState.status === "loading"
    ? uiCopy.androidDownloadChecking
    : uiCopy.androidDownloadUnavailable;
  const status = metadataState.status === "loading" ? "android-checking" : "android-unavailable";

  return (
    <button
      aria-disabled="true"
      className={`${className} ${styles.disabled}`}
      data-download-state={status}
      disabled
      type="button"
    >
      <Smartphone aria-hidden="true" size={28} />
      <span className={styles.copy}>
        <strong>{text(statusCopy)}</strong>
      </span>
      <Download aria-hidden="true" size={26} />
    </button>
  );
}
