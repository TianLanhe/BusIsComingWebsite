import { useSyncExternalStore } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useDownloadMetadata } from "./DownloadMetadataProvider";
import styles from "./DownloadQrCode.module.css";

const desktopQuery = "(min-width: 821px)";

function subscribe(callback: () => void) {
  if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
  const query = window.matchMedia(desktopQuery);
  query.addEventListener?.("change", callback);
  return () => query.removeEventListener?.("change", callback);
}

function getSnapshot() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.(desktopQuery).matches);
}

export function DownloadQrCode() {
  const state = useDownloadMetadata();
  const desktop = useSyncExternalStore(subscribe, getSnapshot, () => false);
  if (!desktop || state.status !== "ready") return null;
  const resolvedUrl = new URL(state.metadata.downloadUrl, window.location.origin).href;
  return (
    <div className={styles.qr} aria-hidden="true" data-qrcode-value={resolvedUrl} data-testid="download-qr-code">
      <QRCodeSVG bgColor="#ffffff" fgColor="#08645d" level="M" marginSize={1} size={126} value={resolvedUrl} />
    </div>
  );
}
