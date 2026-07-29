import { downloadManifest } from "../../content/downloadManifest";
import { useI18n } from "../i18n/I18nProvider";
import { AndroidDownloadAction } from "./AndroidDownloadAction";
import styles from "./DownloadSegmentedButton.module.css";

export function DownloadSegmentedButton({
  compact = false,
  iPhoneStatus,
}: {
  compact?: boolean;
  iPhoneStatus?: string;
}) {
  const { text } = useI18n();
  const ios = downloadManifest.platforms.ios;

  return (
    <div className={`${styles.wrap} ${compact ? styles.compact : ""}`} data-testid="download-segmented-button">
      <AndroidDownloadAction />
      <p className={styles.iphoneStatus}>{iPhoneStatus ?? text(ios.disabledReason ?? ios.description)}</p>
    </div>
  );
}
