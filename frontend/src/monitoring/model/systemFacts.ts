import type { DetailCopyKey } from "../content/types";

export type SystemFactGroup = "storage" | "isolation";

export interface SystemFact {
  id: "retention" | "backup" | "detail-only" | "write-queue";
  group: SystemFactGroup;
  copyKey: DetailCopyKey;
}

// 这些是部署与产品决策，不是从运行时接口推断出的健康状态。
export const SYSTEM_FACTS: readonly SystemFact[] = [
  { id: "retention", group: "storage", copyKey: "retentionLongTerm" },
  { id: "backup", group: "storage", copyKey: "backupDisabled" },
  { id: "detail-only", group: "storage", copyKey: "detailOnlyStorage" },
  { id: "write-queue", group: "isolation", copyKey: "writeQueueDisabled" },
] as const;
