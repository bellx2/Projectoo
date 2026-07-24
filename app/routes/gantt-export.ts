import type { LoaderFunctionArgs } from "react-router";
import { getDb } from "~/lib/db.server";
import { requireMember } from "~/lib/session.server";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
  issueKey,
} from "~/lib/status";

// Excel でそのまま開ける UTF-8(BOM 付き) CSV を返す
export async function loader({ request }: LoaderFunctionArgs) {
  await requireMember(request);
  const db = getDb();
  const memberName = (id: string) =>
    db.members.find((m) => m.id === id)?.name ?? "";
  const projectName = (id: string) =>
    db.projects.find((p) => p.id === id)?.name ?? "";
  const parentTitle = (id: string | null) =>
    id ? (db.tasks.find((t) => t.id === id)?.title ?? "") : "";

  const projectCode = (id: string) =>
    db.projects.find((p) => p.id === id)?.code ?? "";

  // 先頭が =+-@ のセルは Excel に式として評価されないよう ' を付ける
  const esc = (v: string) => {
    const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const header = [
    "キー",
    "種別",
    "件名",
    "親課題",
    "案件",
    "担当者",
    "ステータス",
    "優先度",
    "開始日",
    "期限日",
    "登録日",
  ];
  const lines = [header.map(esc).join(",")];
  for (const t of db.tasks) {
    lines.push(
      [
        issueKey(projectCode(t.projectId), t.key),
        TYPE_LABEL[t.type],
        t.title,
        parentTitle(t.parentId),
        projectName(t.projectId),
        memberName(t.assigneeId),
        STATUS_LABEL[t.status],
        PRIORITY_LABEL[t.priority],
        t.startDate,
        t.endDate,
        t.createdAt,
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
