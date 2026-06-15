import { Apple, Download, Smartphone } from "lucide-react";
import { useState } from "react";
import { downloadManifest } from "../../content/downloadManifest";
import type { DownloadButtonState, DownloadPlatform } from "../../content/types";
import { uiCopy } from "../../content/uiCopy";
import { useI18n } from "../i18n/I18nProvider";
import styles from "./DownloadSegmentedButton.module.css";

const stateByPlatform = {
  android: "android-expanded",
  ios: "iphone-expanded",
} as const;

export function DownloadSegmentedButton({ compact = false }: { compact?: boolean }) {
  const { text } = useI18n();
  const [state, setState] = useState<DownloadButtonState>("default");

  const android = downloadManifest.platforms.android;
  const ios = downloadManifest.platforms.ios;
  const active = state === "iphone-expanded" ? ios : android;
  const isExpanded = state !== "default";

  function activate(platform: DownloadPlatform) {
    setState(stateByPlatform[platform.platform]);
  }

  function handleAction(platform: DownloadPlatform) {
    activate(platform);
    if (platform.status === "available" && platform.downloadUrl) {
      window.location.assign(platform.downloadUrl);
    }
  }

  return (
    <div
      className={`${styles.wrap} ${compact ? styles.compact : ""}`}
      onMouseLeave={() => setState("default")}
      data-state={state}
      data-testid="download-segmented-button"
    >
      {!isExpanded ? (
        <div className={styles.defaultState} aria-label={text(uiCopy.downloadAppLabel)}>
          <button
            type="button"
            className={styles.segment}
            onMouseEnter={() => activate(android)}
            onFocus={() => activate(android)}
            onClick={() => handleAction(android)}
          >
            <Smartphone aria-hidden="true" size={30} />
            <span>
              <strong>{text(android.label)}</strong>
              <small>{text(android.description)}</small>
            </span>
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <button
            type="button"
            className={styles.segment}
            onMouseEnter={() => activate(ios)}
            onFocus={() => activate(ios)}
            onClick={(event) => {
              event.preventDefault();
              handleAction(ios);
            }}
          >
            <Apple aria-hidden="true" size={30} />
            <span>
              <strong>{text(ios.label)}</strong>
              <small>{text(ios.description)}</small>
            </span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={`${styles.expanded} ${active.platform === "ios" ? styles.ios : styles.android}`}
          onMouseEnter={() => activate(active)}
          onFocus={() => activate(active)}
          onClick={(event) => {
            event.preventDefault();
            handleAction(active);
          }}
          aria-disabled={active.status !== "available"}
          data-testid="download-expanded"
        >
          {active.platform === "ios" ? <Apple aria-hidden="true" size={36} /> : <Smartphone aria-hidden="true" size={36} />}
          <span className={styles.expandedCopy}>
            <strong>{text(active.actionLabel)}</strong>
            <small>{active.disabledReason ? text(active.disabledReason) : text(active.description)}</small>
          </span>
          {active.status === "available" ? <Download aria-hidden="true" size={32} /> : <span className={styles.blocked}>!</span>}
        </button>
      )}
    </div>
  );
}
