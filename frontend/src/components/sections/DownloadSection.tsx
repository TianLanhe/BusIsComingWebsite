import { DownloadSegmentedButton } from "../download/DownloadSegmentedButton";
import { homepageContent } from "../../content/homepageContent";
import { downloadManifest } from "../../content/downloadManifest";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSection.module.css";

export function DownloadSection() {
  const { text } = useI18n();
  const android = downloadManifest.platforms.android;
  const statusCopy = android.status === "available" && android.artifact ? uiCopy.downloadReady : uiCopy.downloadUnavailable;

  return (
    <section id="download" className={styles.section}>
      <div className={styles.inner}>
        <div>
          <h2>{text(homepageContent.downloadSection.title)}</h2>
          <p>{text(homepageContent.downloadSection.description)}</p>
          <p className={styles.status}>{text(statusCopy)}</p>
        </div>
        <DownloadSegmentedButton compact />
      </div>
    </section>
  );
}
