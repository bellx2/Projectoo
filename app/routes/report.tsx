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
  startOfWeek,
  toISODate,
  today,
} from "~/lib/date";
import { buildMarkdown, buildMemberReport } from "~/lib/report.server";

export function meta() {
  return [{ title: "週報 | ProjectHub" }];
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
