import { Link, useLoaderData } from "react-router";
import { getDb } from "~/lib/db.server";
import { formatMD, toISODate, today } from "~/lib/date";
import { STATUS_LABEL, STATUS_ORDER } from "~/lib/status";

export function meta() {
  return [{ title: "ダッシュボード | ProjectHub" }];
}

export async function loader() {
  const db = getDb();
  const recentComments = [...db.comments]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
    .map((c) => ({
      ...c,
      task: db.tasks.find((t) => t.id === c.taskId) ?? null,
    }));
  return {
    members: db.members,
    projects: db.projects,
    tasks: db.tasks,
    knowledge: db.knowledge.slice(0, 4),
    recentComments,
    todayStr: toISODate(today()),
  };
}

export default function Dashboard() {
  const { members, projects, tasks, knowledge, recentComments, todayStr } =
    useLoaderData<typeof loader>();

  const count = (s: string) => tasks.filter((t) => t.status === s).length;
  const doneRate =
    tasks.length === 0 ? 0 : Math.round((count("done") / tasks.length) * 100);
  const overdue = tasks.filter(
    (t) => t.endDate < todayStr && t.status !== "done",
  );
  const upcoming = tasks
    .filter((t) => t.status !== "done" && t.endDate >= todayStr)
    .sort((a, b) => a.endDate.localeCompare(b.endDate))
    .slice(0, 6);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">ダッシュボード</h1>
          <p className="page-sub">プロジェクト全体の進捗サマリー</p>
        </div>
        <Link className="btn primary" to="/tasks/new">
          ＋ 課題を追加
        </Link>
      </div>

      <div className="stat-grid">
        <div className="card stat">
          <div className="stat-label">全課題</div>
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-note">{projects.length} 案件</div>
        </div>
        <div className="card stat">
          <div className="stat-label">処理中</div>
          <div className="stat-value">{count("in_progress")}</div>
          <div className="stat-note">未対応 {count("open")} 件</div>
        </div>
        <div className="card stat">
          <div className="stat-label">完了率</div>
          <div className="stat-value">{doneRate}%</div>
          <div className="stat-note">完了 {count("done")} 件</div>
        </div>
        <div className="card stat">
          <div className="stat-label">期限超過</div>
          <div className="stat-value" style={overdue.length > 0 ? { color: "#b91c1c" } : undefined}>
            {overdue.length}
          </div>
          <div className="stat-note">要フォロー</div>
        </div>
      </div>

      <div className="dash-grid">
        <div>
          <div className="card panel">
            <h2>案件の進捗</h2>
            {projects.map((p) => {
              const pTasks = tasks.filter((t) => t.projectId === p.id);
              const done = pTasks.filter((t) => t.status === "done").length;
              const pct =
                pTasks.length === 0
                  ? 0
                  : Math.round((done / pTasks.length) * 100);
              return (
                <div className="progress-row" key={p.id}>
                  <span className="name">
                    <span className="chip">{p.code}</span> {p.name}
                  </span>
                  <span className="progress-track">
                    <span
                      className="progress-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="progress-pct">{pct}%</span>
                </div>
              );
            })}
          </div>

          <div className="card panel">
            <h2>直近の期限</h2>
            {upcoming.map((t) => {
              const m = members.find((x) => x.id === t.assigneeId);
              return (
                <div className="list-row" key={t.id}>
                  {m && (
                    <span className="avatar" style={{ background: m.color }}>
                      {m.initial}
                    </span>
                  )}
                  <span className="grow">
                    <Link to={`/issues/${t.id}`}>{t.title}</Link>
                  </span>
                  <span className={`badge st-${t.status}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                  <span className="muted">〜{formatMD(t.endDate)}</span>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <p className="muted">期限が近い課題はありません。</p>
            )}
          </div>

          <div className="card panel">
            <h2>最近の更新</h2>
            {recentComments.map((c) => {
              const m = members.find((x) => x.id === c.authorId);
              return (
                <div className="list-row" key={c.id}>
                  {m && (
                    <span className="avatar" style={{ background: m.color }}>
                      {m.initial}
                    </span>
                  )}
                  <span className="grow">
                    <span className="muted">{m?.name} がコメント: </span>
                    {c.task ? (
                      <Link to={`/issues/${c.task.id}`}>{c.task.title}</Link>
                    ) : (
                      <span className="muted">(削除済みの課題)</span>
                    )}
                  </span>
                  <span className="muted">
                    {formatMD(c.createdAt.slice(0, 10))}
                  </span>
                </div>
              );
            })}
            {recentComments.length === 0 && (
              <p className="muted">まだ更新はありません。</p>
            )}
          </div>
        </div>

        <div>
          <div className="card panel">
            <h2>ステータス内訳</h2>
            {STATUS_ORDER.map((s) => {
              const n = count(s);
              const pct =
                tasks.length === 0 ? 0 : Math.round((n / tasks.length) * 100);
              return (
                <div className="progress-row" key={s}>
                  <span className="name">
                    <span
                      className="legend-dot"
                      style={{
                        background: `var(--status-${s.replace("_", "-")})`,
                        display: "inline-block",
                        marginRight: 6,
                      }}
                    />
                    {STATUS_LABEL[s]}
                  </span>
                  <span className="progress-track">
                    <span
                      className="progress-fill"
                      style={{
                        width: `${pct}%`,
                        background: `var(--status-${s.replace("_", "-")})`,
                      }}
                    />
                  </span>
                  <span className="progress-pct">{n}件</span>
                </div>
              );
            })}
          </div>

          <div className="card panel">
            <h2>メンバーの担当状況</h2>
            {members.map((m) => {
              const active = tasks.filter(
                (t) =>
                  t.assigneeId === m.id &&
                  (t.status === "open" || t.status === "in_progress"),
              ).length;
              return (
                <div className="list-row" key={m.id}>
                  <span className="avatar" style={{ background: m.color }}>
                    {m.initial}
                  </span>
                  <span className="grow">{m.name}</span>
                  <span className="muted">対応中 {active} 件</span>
                </div>
              );
            })}
          </div>

          <div className="card panel">
            <h2>最近のWiki</h2>
            {knowledge.map((k) => (
              <div className="list-row" key={k.id}>
                <span className="grow">
                  <Link to={`/knowledge/${k.id}`}>{k.title}</Link>
                </span>
                <span className="muted">{formatMD(k.updatedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
