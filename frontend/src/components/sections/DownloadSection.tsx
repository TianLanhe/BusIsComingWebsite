import { homepageContent } from "../../content/homepageContent";
import { useDownloadConvergence } from "../../hooks/useDownloadConvergence";
import { AndroidDownloadAction } from "../download/AndroidDownloadAction";
import { DownloadMetadataLine } from "../download/DownloadMetadataLine";
import { DownloadQrCode } from "../download/DownloadQrCode";
import { WindField } from "../homepage/WindField";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSection.module.css";

export function DownloadSection() {
  const { text } = useI18n();
  const { targetRef, converged } = useDownloadConvergence<HTMLElement>();

  return (
    <section
      className={styles.section}
      data-converged={converged ? "true" : "false"}
      id="download"
      ref={targetRef}
    >
      <WindField intensity="download" />
      <div className={styles.convergence} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className={styles.inner}>
        <p className={styles.eyebrow}>03 / DOWNLOAD</p>
        <h2>{text(homepageContent.downloadDecision.title)}</h2>
        <p className={styles.description}>{text(homepageContent.downloadDecision.description)}</p>
        <div className={styles.actionRow}>
          <div className={styles.action}>
            <AndroidDownloadAction />
            <DownloadMetadataLine />
            <small>{text(homepageContent.downloadDecision.installationNote)}</small>
          </div>
          <DownloadQrCode />
        </div>
      </div>
    </section>
  );
}
