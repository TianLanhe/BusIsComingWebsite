import { DownloadSegmentedButton } from "../download/DownloadSegmentedButton";
import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSection.module.css";

export function DownloadSection() {
  const { text } = useI18n();
  const androidCard = homepageContent.downloadSection.androidCard;

  return (
    <section id="download" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2>{text(homepageContent.downloadSection.title)}</h2>
          <p>{text(homepageContent.downloadSection.description)}</p>
          <p className={styles.status}>{text(androidCard.title)} · {text(androidCard.meta)}</p>
          <p className={styles.iphone}>{text(homepageContent.downloadSection.iphoneStatus)}</p>
        </div>
        <DownloadSegmentedButton compact />
      </div>
    </section>
  );
}
