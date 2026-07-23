import { getDb } from "~/lib/db.server";
import { STATUS_LABEL, PRIORITY_LABEL } from "~/lib/status";

// Excel でそのまま開ける UTF-8(BOM 付き) CSV を返す
export async function loader() {
  const db = getDb();
  const memberName = (id: string) =>
    db.members.find((m) => m.id === id)?.name ?? "";
  const projectName = (id: string) =>
    db.projects.find((p) => p.id === id)?.name ?? "";
  const parentTitle = (id: string | null) =>
    id ? (db.tasks.find((t) => t.id === id)?.title ?? "") : "";

  const esc = (v: string) => `"${v.replaceAll('"', '""')}"`;
  const header = [
    "件名",
    "親課題",
    "案件",
    "担当者",
    "ステータス",
    "優先度",
    "開始日",
    "終了日",
  ];
  const lines = [header.map(esc).join(",")];
  for (const t of db.tasks) {
    lines.push(
      [
        t.title,
        parentTitle(t.parentId),
        projectName(t.projectId),
        memberName(t.assigneeId),
        STATUS_LABEL[t.status],
        PRIORITY_LABEL[t.priority],
        t.startDate,
        t.endDate,
      ]
        .map(esc)
        .join(","),
    );
  }
  const csv = "\uFEFF" + lines.join("\r\n") + "\r\n";
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="projecthub_tasks.csv"',
    },
  });
}
