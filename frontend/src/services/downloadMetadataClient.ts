import type { Locale } from "../content/types";
import { buildAnalyticsHeaders } from "./analyticsSource";

export interface LatestAPKMetadata {
  platform: "android";
  status: "available";
  versionName: string;
  versionCode: number;
  fileName: string;
  sizeBytes: number;
  lastUpdated: string;
  downloadUrl: "/api/downloads/android/latest";
}

export class DownloadMetadataError extends Error {
  constructor(readonly status: number) {
    super("APK_METADATA_UNAVAILABLE");
    this.name = "DownloadMetadataError";
  }
}

export async function fetchLatestAPKMetadata(locale: Locale, signal?: AbortSignal): Promise<LatestAPKMetadata> {
  let response: Response;
  try {
    response = await fetch("/api/downloads/android/latest/metadata", {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json", ...buildAnalyticsHeaders({ homeLocale: locale }) },
      signal,
    });
  } catch {
    throw new DownloadMetadataError(0);
  }
  if (!response.ok) {
    throw new DownloadMetadataError(response.status);
  }
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    throw new DownloadMetadataError(response.status);
  }
  if (!isLatestAPKMetadata(value)) {
    throw new DownloadMetadataError(response.status);
  }
  return value;
}

function isLatestAPKMetadata(value: unknown): value is LatestAPKMetadata {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return item.platform === "android" && item.status === "available"
    && typeof item.versionName === "string" && item.versionName.length > 0
    && Number.isInteger(item.versionCode) && Number(item.versionCode) > 0
    && typeof item.fileName === "string" && item.fileName.length > 0 && !/[\\/]/.test(item.fileName)
    && Number.isInteger(item.sizeBytes) && Number(item.sizeBytes) > 0
    && typeof item.lastUpdated === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.lastUpdated)
    && item.downloadUrl === "/api/downloads/android/latest";
}
