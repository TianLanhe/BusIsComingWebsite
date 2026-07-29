import { DownloadSegmentedButton } from "../download/DownloadSegmentedButton";
import { homepageContent } from "../../content/homepageContent";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSection.module.css";

export function DownloadSection() {
  const { text } = useI18n();

  return (
    <section id="download" className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.copy}>
          <h2>{text(homepageContent.downloadSection.title)}</h2>
          <p>{text(homepageContent.downloadSection.description)}</p>
        </div>
        <DownloadSegmentedButton compact iPhoneStatus={text(homepageContent.downloadSection.iphoneStatus)} />
      </div>
    </section>
  );
}
