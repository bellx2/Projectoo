import { addDays, formatMD, formatYMD, parseISODate, toISODate } from "./date";
import { STATUS_LABEL, issueKey } from "./status";
import type { Database, Member, Task } from "./types";

export interface ReportItem {
  taskId: string;
  keyLabel: string;
  title: string;
}

export interface MemberReport {
  member: Member;
  done: (ReportItem & { to: string; toLabel: string; at: string })[];
  progressComments: (ReportItem & { body: string; at: string })[];
  inProgress: (ReportItem & { endDate: string; overdue: boolean })[];
  planned: (ReportItem & { startDate: string; endDate: string })[];
  overdue: (ReportItem & { endDate: string })[];
}

function taskItem(db: Database, task: Task): ReportItem {
  const project = db.projects.find((p) => p.id === task.projectId);
  return {
    taskId: task.id,
    keyLabel: project ? issueKey(project.code, task.key) : `#${task.key}`,
    title: task.title,
  };
}

export function buildMemberReport(
  db: Database,
  member: Member,
  ws: string,
  we: string,
  todayStr: string,
): MemberReport {
  const inWeek = (dt: string) => {
    const d = dt.slice(0, 10);
    return d >= ws && d <= we;
  };
  const nextWs = toISODate(addDays(parseISODate(we), 1));
  const nextWe = toISODate(addDays(parseISODate(we), 7));

  // 今週 完了/処理済み にしたもの (課題ごとに最新の変更だけ残す)
  const doneMap = new Map<string, { to: string; at: string }>();
  for (const a of db.activities) {
    if (
      a.type === "status" &&
      a.memberId === member.id &&
      (a.to === "done" || a.to === "resolved") &&
      inWeek(a.createdAt)
    ) {
      const prev = doneMap.get(a.taskId);
      if (!prev || prev.at < a.createdAt) {
        doneMap.set(a.taskId, { to: a.to, at: a.createdAt });
      }
    }
  }
  const done = [...doneMap.entries()]
    .map(([taskId, v]) => {
      const task = db.tasks.find((t) => t.id === taskId);
      if (!task) return null;
      return {
        ...taskItem(db, task),
        to: v.to,
        toLabel: STATUS_LABEL[v.to as keyof typeof STATUS_LABEL],
        at: v.at,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.at.localeCompare(b.at));

  // 今週のコメント (進捗メモ)
  const progressComments = db.comments
    .filter((c) => c.authorId === member.id && inWeek(c.createdAt))
    .map((c) => {
      const task = db.tasks.find((t) => t.id === c.taskId);
      if (!task) return null;
      return { ...taskItem(db, task), body: c.body, at: c.createdAt };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a.at.localeCompare(b.at));

  // 現在進行中
  const inProgress = db.tasks
    .filter((t) => t.assigneeId === member.id && t.status === "in_progress")
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .map((t) => ({
      ...taskItem(db, t),
      endDate: t.endDate,
      overdue: t.endDate < todayStr,
    }));

  // 来週の予定 (来週に開始 or 期限が来るもの)
  const planned = db.tasks
    .filter(
      (t) =>
        t.assigneeId === member.id &&
        t.status !== "done" &&
        ((t.startDate >= nextWs && t.startDate <= nextWe) ||
          (t.endDate >= nextWs && t.endDate <= nextWe)),
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .map((t) => ({
      ...taskItem(db, t),
      startDate: t.startDate,
      endDate: t.endDate,
    }));

  // 期限超過 (未完了)
  const overdue = db.tasks
    .filter(
      (t) =>
        t.assigneeId === member.id &&
        (t.status === "open" || t.status === "in_progress") &&
        t.endDate < todayStr,
    )
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .map((t) => ({ ...taskItem(db, t), endDate: t.endDate }));

  return { member, done, progressComments, inProgress, planned, overdue };
}

export function buildMarkdown(
  reports: MemberReport[],
  ws: string,
  we: string,
  scopeLabel: string,
): string {
  const lines: string[] = [];
  lines.push(
    `# 週報 ${formatYMD(ws)} 〜 ${formatYMD(we)}${scopeLabel ? ` (${scopeLabel})` : ""}`,
  );
  for (const r of reports) {
    lines.push("");
    lines.push(`## ${r.member.name}`);
    lines.push("");
    lines.push("### 今週やったこと");
    if (r.done.length === 0 && r.progressComments.length === 0) {
      lines.push("- (なし)");
    } else {
      for (const d of r.done) {
        lines.push(`- [${d.keyLabel}] ${d.title} → ${d.toLabel} (${formatMD(d.at.slice(0, 10))})`);
      }
      for (const c of r.progressComments) {
        const body = c.body.replaceAll("\n", " ");
        lines.push(`- (メモ) [${c.keyLabel}] ${c.title}: ${body}`);
      }
    }
    lines.push("");
    lines.push("### 進行中");
    if (r.inProgress.length === 0) lines.push("- (なし)");
    for (const t of r.inProgress) {
      lines.push(
        `- [${t.keyLabel}] ${t.title} (期限 ${formatMD(t.endDate)}${t.overdue ? " ⚠遅延" : ""})`,
      );
    }
    lines.push("");
    lines.push("### 来週の予定");
    if (r.planned.length === 0) lines.push("- (なし)");
    for (const t of r.planned) {
      lines.push(
        `- [${t.keyLabel}] ${t.title} (${formatMD(t.startDate)}〜${formatMD(t.endDate)})`,
      );
    }
    lines.push("");
    lines.push("### 課題・相談");
    if (r.overdue.length === 0) lines.push("- 特になし");
    for (const t of r.overdue) {
      lines.push(`- ⚠ 期限超過: [${t.keyLabel}] ${t.title} (期限 ${formatMD(t.endDate)})`);
    }
  }
  return lines.join("\n") + "\n";
}
