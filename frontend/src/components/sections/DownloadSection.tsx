import { DownloadSegmentedButton } from "../download/DownloadSegmentedButton";
import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import { useDownloadMetadata, versionAPKMetadataText } from "../download/DownloadMetadataProvider";
import styles from "./DownloadSection.module.css";

export function DownloadSection() {
  const { locale, text } = useI18n();
  const metadataState = useDownloadMetadata();
  const androidCard = homepageContent.downloadSection.androidCard;

  return (
    <section id="download" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2>{text(homepageContent.downloadSection.title)}</h2>
          <p>{text(homepageContent.downloadSection.description)}</p>
          <p className={styles.status}>{text(androidCard.title)} · {metadataState.status === "ready" ? versionAPKMetadataText(metadataState.metadata, locale) : text(androidCard.meta)}</p>
          <p className={styles.iphone}>{text(homepageContent.downloadSection.iphoneStatus)}</p>
        </div>
        <DownloadSegmentedButton compact />
      </div>
    </section>
  );
}
