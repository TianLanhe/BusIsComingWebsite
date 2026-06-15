import { DownloadSegmentedButton } from "../download/DownloadSegmentedButton";
import { homepageContent } from "../../content/homepageContent";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSection.module.css";

export function DownloadSection() {
  const { text } = useI18n();

  return (
    <section id="download" className={styles.section}>
      <div className={styles.inner}>
        <div>
          <h2>{text(homepageContent.downloadSection.title)}</h2>
          <p>{text(homepageContent.downloadSection.description)}</p>
          <p className={styles.status}>{text(uiCopy.downloadUnavailable)}</p>
        </div>
        <DownloadSegmentedButton compact />
      </div>
    </section>
  );
}
