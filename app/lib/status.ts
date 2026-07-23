import type { IssueType, Priority, ProjectStatus, TaskStatus } from "./types";

export const STATUS_ORDER: TaskStatus[] = [
  "open",
  "in_progress",
  "resolved",
  "done",
];

export const STATUS_LABEL: Record<TaskStatus, string> = {
  open: "未対応",
  in_progress: "処理中",
  resolved: "処理済み",
  done: "完了",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: "計画中",
  active: "進行中",
  done: "完了",
};

export const TYPE_LABEL: Record<IssueType, string> = {
  task: "タスク",
  bug: "バグ",
  request: "要望",
  other: "その他",
};

export const PRIORITY_ARROW: Record<Priority, string> = {
  high: "↑",
  medium: "→",
  low: "↓",
};

export function isTaskStatus(v: unknown): v is TaskStatus {
  return (
    typeof v === "string" && (STATUS_ORDER as string[]).includes(v)
  );
}

export function isIssueType(v: unknown): v is IssueType {
  return (
    typeof v === "string" && Object.keys(TYPE_LABEL).includes(v)
  );
}

export function issueKey(projectCode: string, key: number): string {
  return `${projectCode}-${key}`;
}
