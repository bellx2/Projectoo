import { useState } from "react";
import {
  Form,
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { getDb } from "~/lib/db.server";
import { getCurrentMember } from "~/lib/session.server";
import {
  addDays,
  formatMD,
  formatYMD,
  parseISODate,
  startOfWeek,
  toISODate,
  today,
} from "~/lib/date";
import { STATUS_LABEL, issueKey } from "~/lib/status";
import type { Database, Member, Task } from "~/lib/types";

export function meta() {
  return [{ title: "週報 | ProjectHub" }];
}

interface ReportItem {
  taskId: string;
  keyLabel: string;
  title: string;
}

interface MemberReport {
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

function buildMemberReport(
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

function buildMarkdown(
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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const w = Number(url.searchParams.get("w") ?? "0") || 0;
  const db = getDb();
  const me = await getCurrentMember(request);

  const memberParam = url.searchParams.get("member") ?? me?.id ?? "all";

  let targets = db.members;
  let scopeLabel = "全員";
  if (memberParam.startsWith("team:")) {
    const team = db.teams.find((t) => t.id === memberParam.slice(5));
    targets = team
      ? db.members.filter((m) => team.memberIds.includes(m.id))
      : [];
    scopeLabel = team?.name ?? "チーム";
  } else if (memberParam !== "all") {
    targets = db.members.filter((m) => m.id === memberParam);
    scopeLabel = targets[0]?.name ?? "";
  }

  const base = today();
  const ws = toISODate(addDays(startOfWeek(base), w * 7));
  const we = toISODate(addDays(startOfWeek(base), w * 7 + 6));
  const todayStr = toISODate(base);

  const reports = targets.map((m) =>
    buildMemberReport(db, m, ws, we, todayStr),
  );
  const markdown = buildMarkdown(reports, ws, we, scopeLabel);

  return {
    reports,
    markdown,
    members: db.members,
    teams: db.teams,
    memberParam,
    scopeLabel,
    w,
    ws,
    we,
  };
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="btn primary"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? "✓ コピーしました" : "⧉ Markdownをコピー"}
    </button>
  );
}

export default function Report() {
  const { reports, markdown, members, teams, memberParam, w, ws, we } =
    useLoaderData<typeof loader>();

  const weekLink = (offset: number) =>
    `?w=${offset}&member=${encodeURIComponent(memberParam)}`;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">週報</h1>
          <p className="page-sub">
            課題の履歴・コメントから週報ドラフトを自動生成します
          </p>
        </div>
        <CopyButton text={markdown} />
      </div>

      <div className="report-toolbar">
        <span className="week-nav">
          <Link className="btn small" to={weekLink(w - 1)}>
            ← 前週
          </Link>
          <span className="week-label">
            {formatYMD(ws)} 〜 {formatYMD(we)}
            {w === 0 && <span className="muted"> (今週)</span>}
          </span>
          <Link className="btn small" to={weekLink(w + 1)}>
            翌週 →
          </Link>
          {w !== 0 && (
            <Link className="btn small" to={weekLink(0)}>
              今週へ
            </Link>
          )}
        </span>
        <Form method="get" className="toolbar" style={{ margin: 0 }}>
          <input type="hidden" name="w" value={w} />
          <select
            name="member"
            defaultValue={memberParam}
            onChange={(e) => e.currentTarget.form?.submit()}
          >
            <optgroup label="メンバー">
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </optgroup>
            {teams.length > 0 && (
              <optgroup label="チーム">
                {teams.map((t) => (
                  <option key={t.id} value={`team:${t.id}`}>
                    {t.name} ({t.memberIds.length}人)
                  </option>
                ))}
              </optgroup>
            )}
            <option value="all">全員</option>
          </select>
        </Form>
      </div>

      {reports.map((r) => (
        <div className="report-member" key={r.member.id}>
          <div className="report-member-head">
            <span className="avatar lg" style={{ background: r.member.color }}>
              {r.member.initial}
            </span>
            <span className="name">{r.member.name}</span>
          </div>

          <div className="card report-section">
            <h3>✅ 今週やったこと</h3>
            {r.done.length === 0 && r.progressComments.length === 0 && (
              <p className="report-empty">
                この週の完了・進捗コメントはありません。
              </p>
            )}
            {r.done.map((d) => (
              <div className="list-row" key={`d-${d.taskId}`}>
                <span className="ikey">{d.keyLabel}</span>
                <span className="grow">
                  <Link to={`/issues/${d.taskId}`}>{d.title}</Link>
                </span>
                <span className={`badge st-${d.to}`}>{d.toLabel}</span>
                <span className="muted">{formatMD(d.at.slice(0, 10))}</span>
              </div>
            ))}
            {r.progressComments.map((c, i) => (
              <div className="list-row" key={`c-${i}`}>
                <span className="ikey">{c.keyLabel}</span>
                <span className="grow">
                  <Link to={`/issues/${c.taskId}`}>{c.title}</Link>
                  <div className="report-comment-body">「{c.body}」</div>
                </span>
                <span className="muted">{formatMD(c.at.slice(0, 10))}</span>
              </div>
            ))}
          </div>

          <div className="card report-section">
            <h3>🔄 進行中</h3>
            {r.inProgress.length === 0 && (
              <p className="report-empty">進行中の課題はありません。</p>
            )}
            {r.inProgress.map((t) => (
              <div className="list-row" key={t.taskId}>
                <span className="ikey">{t.keyLabel}</span>
                <span className="grow">
                  <Link to={`/issues/${t.taskId}`}>{t.title}</Link>
                </span>
                <span className={"muted" + (t.overdue ? " overdue" : "")}>
                  期限 {formatMD(t.endDate)}
                  {t.overdue && " ⚠"}
                </span>
              </div>
            ))}
          </div>

          <div className="card report-section">
            <h3>📅 来週の予定</h3>
            {r.planned.length === 0 && (
              <p className="report-empty">来週予定の課題はありません。</p>
            )}
            {r.planned.map((t) => (
              <div className="list-row" key={t.taskId}>
                <span className="ikey">{t.keyLabel}</span>
                <span className="grow">
                  <Link to={`/issues/${t.taskId}`}>{t.title}</Link>
                </span>
                <span className="muted">
                  {formatMD(t.startDate)}〜{formatMD(t.endDate)}
                </span>
              </div>
            ))}
          </div>

          <div className="card report-section">
            <h3>⚠ 課題・相談</h3>
            {r.overdue.length === 0 && (
              <p className="report-empty">特になし。</p>
            )}
            {r.overdue.map((t) => (
              <div className="list-row" key={t.taskId}>
                <span className="ikey">{t.keyLabel}</span>
                <span className="grow">
                  <span className="overdue">期限超過: </span>
                  <Link to={`/issues/${t.taskId}`}>{t.title}</Link>
                </span>
                <span className="muted overdue">期限 {formatMD(t.endDate)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
