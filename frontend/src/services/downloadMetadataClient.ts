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
    && isContractVersionName(item.versionName)
    && Number.isInteger(item.versionCode) && Number(item.versionCode) > 0
    && typeof item.fileName === "string" && item.fileName.length > 0 && !/[\\/]/.test(item.fileName)
    && Number.isInteger(item.sizeBytes) && Number(item.sizeBytes) > 0
    && isContractDate(item.lastUpdated)
    && item.downloadUrl === "/api/downloads/android/latest";
}

function isContractVersionName(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const characterCount = Array.from(value).length;
  return characterCount >= 1 && characterCount <= 64;
}

function isContractDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const [, yearPart, monthPart, dayPart] = match;
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  const day = Number(dayPart);
  // Date 会自动归一化越界月份/日期，因此必须把归一化后的年月日再与契约输入逐项核对。
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, monthIndex, day);
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === monthIndex
    && date.getUTCDate() === day;
}
