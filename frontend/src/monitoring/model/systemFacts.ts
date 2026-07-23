export type SystemFactGroup = "storage" | "sqlite" | "service";

export type SystemFactKey =
  | "rowCount" | "todayRowCount" | "databaseSize" | "lastSuccessfulWrite"
  | "sqliteVersion" | "journalMode" | "schemaVersion"
  | "processStarted" | "processUptime" | "dropped" | "listenerState" | "listenerAddress";

export interface SystemFactDefinition { key: SystemFactKey; group: SystemFactGroup; }

// 只列出 API 的十二项动态事实；固定隐私规则 publicProxy=false 不伪装成探测结果。
export const SYSTEM_FACTS: readonly SystemFactDefinition[] = [
  { key: "rowCount", group: "storage" }, { key: "todayRowCount", group: "storage" },
  { key: "databaseSize", group: "storage" }, { key: "lastSuccessfulWrite", group: "storage" },
  { key: "sqliteVersion", group: "sqlite" }, { key: "journalMode", group: "sqlite" },
  { key: "schemaVersion", group: "sqlite" }, { key: "processStarted", group: "service" },
  { key: "processUptime", group: "service" }, { key: "dropped", group: "service" },
  { key: "listenerState", group: "service" }, { key: "listenerAddress", group: "service" },
] as const;
