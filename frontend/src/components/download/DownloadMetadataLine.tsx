import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import { formatAPKSize, useDownloadMetadata } from "./DownloadMetadataProvider";
import styles from "./DownloadMetadataLine.module.css";

export function DownloadMetadataLine({ compact = false }: { compact?: boolean }) {
  const { locale, text } = useI18n();
  const state = useDownloadMetadata();

  if (state.status === "loading") {
    return <p className={styles.line} data-compact={compact}>{text(homepageContent.downloadDecision.checkingState)}</p>;
  }
  if (state.status === "unavailable") {
    return <p className={styles.line} data-compact={compact}>{text(homepageContent.downloadDecision.unavailableState)}</p>;
  }

  const dateLocale = locale === "zh-Hant" ? "zh-Hant-HK" : locale === "zh-Hans" ? "zh-Hans-CN" : "en-GB";
  const updated = new Intl.DateTimeFormat(dateLocale, { year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(`${state.metadata.lastUpdated}T00:00:00Z`));

  return (
    <p className={styles.line} data-compact={compact} data-testid="download-metadata-line">
      <span>v{state.metadata.versionName}</span>
      <span aria-hidden="true">·</span>
      <span>{text(homepageContent.downloadDecision.minimumAndroid)}</span>
      <span aria-hidden="true">·</span>
      <span>{formatAPKSize(state.metadata.sizeBytes, locale)}</span>
      <span aria-hidden="true">·</span>
      <span>{updated}</span>
    </p>
  );
}
