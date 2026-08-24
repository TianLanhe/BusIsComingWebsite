import { homepageContent } from "../../content/homepageContent";
import { getStoryAsset } from "../../content/storyAssets";
import { uiCopy } from "../../content/uiCopy";
import { useDownloadConvergence } from "../../hooks/useDownloadConvergence";
import { AndroidDownloadAction } from "../download/AndroidDownloadAction";
import { DownloadMetadataLine } from "../download/DownloadMetadataLine";
import { DownloadQrCode } from "../download/DownloadQrCode";
import { WindField } from "../homepage/WindField";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSection.module.css";

export function DownloadSection() {
  const { locale, text } = useI18n();
  const { targetRef, converged } = useDownloadConvergence<HTMLElement>();
  const previewAsset = getStoryAsset("route-search", locale);

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
        <p className={styles.eyebrow}>{text(uiCopy.downloadSectionEyebrow)}</p>
        <h2>{text(homepageContent.downloadDecision.title)}</h2>
        <p className={styles.description}>{text(homepageContent.downloadDecision.description)}</p>
        <div className={styles.metadata}>
          <DownloadMetadataLine />
        </div>
        <div className={styles.actionRow}>
          <div className={styles.qrGroup}>
            <DownloadQrCode />
            <p>{text(uiCopy.downloadQrLabel)}</p>
          </div>
          <div className={styles.action}>
            <AndroidDownloadAction />
            <small>{text(homepageContent.downloadDecision.installationNote)}</small>
          </div>
        </div>
        <div className={styles.mobilePreview} aria-hidden="true">
          <div>
            <img
              alt=""
              decoding="async"
              height={previewAsset.height}
              loading="lazy"
              sizes="160px"
              src={previewAsset.src}
              srcSet={previewAsset.srcSet}
              width={previewAsset.width}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
