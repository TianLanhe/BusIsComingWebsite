import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Locale } from "../../content/types";
import { fetchLatestAPKMetadata, type LatestAPKMetadata } from "../../services/downloadMetadataClient";
import { useI18n } from "../i18n/I18nProvider";

type DownloadMetadataState =
  | { status: "loading"; metadata: null }
  | { status: "ready"; metadata: LatestAPKMetadata }
  | { status: "unavailable"; metadata: null };

const defaultState: DownloadMetadataState = { status: "unavailable", metadata: null };
const DownloadMetadataContext = createContext<DownloadMetadataState>(defaultState);
let requestsByDocument = new WeakMap<Document, Promise<LatestAPKMetadata>>();

export function DownloadMetadataProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  const [state, setState] = useState<DownloadMetadataState>({ status: "loading", metadata: null });

  useEffect(() => {
    let active = true;
    let request = requestsByDocument.get(document);
    if (!request) {
      // 同一 document 共享一次 in-flight 请求；StrictMode 重挂载、Hero/下载区和语言切换都复用它。
      request = fetchLatestAPKMetadata(locale);
      requestsByDocument.set(document, request);
    }
    request.then(
      (metadata) => { if (active) setState({ status: "ready", metadata }); },
      () => { if (active) setState({ status: "unavailable", metadata: null }); },
    );
    return () => { active = false; };
  }, []);

  const value = useMemo(() => state, [state]);
  return <DownloadMetadataContext.Provider value={value}>{children}</DownloadMetadataContext.Provider>;
}

export function useDownloadMetadata(): DownloadMetadataState {
  return useContext(DownloadMetadataContext);
}

export function formatAPKSize(sizeBytes: number, locale: Locale): string {
  const intlLocale = locale === "zh-Hant" ? "zh-Hant-HK" : locale === "zh-Hans" ? "zh-Hans-CN" : "en";
  return new Intl.NumberFormat(intlLocale, {
    style: "unit", unit: "megabyte", unitDisplay: "short", maximumFractionDigits: 1,
  }).format(sizeBytes / 1024 / 1024).replace(/\u00a0/g, " ");
}

export function heroAPKMetadataText(metadata: LatestAPKMetadata, locale: Locale): string {
  return `Android APK ${metadata.versionName} · ${formatAPKSize(metadata.sizeBytes, locale)}`;
}

export function versionAPKMetadataText(metadata: LatestAPKMetadata, locale: Locale): string {
  const version = locale === "en" ? "Version" : locale === "zh-Hant" ? "版本" : "版本";
  return `${version} ${metadata.versionName} · ${formatAPKSize(metadata.sizeBytes, locale)}`;
}

export function resetDownloadMetadataForTests() {
  requestsByDocument = new WeakMap<Document, Promise<LatestAPKMetadata>>();
}
