import {
  Form,
  Link,
  redirect,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import {
  createComment,
  deleteTask,
  getDb,
  nowStamp,
  updateTask,
} from "~/lib/db.server";
import { getCurrentMember } from "~/lib/session.server";
import { formatYMD } from "~/lib/date";
import {
  PRIORITY_ARROW,
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  TYPE_LABEL,
  isTaskStatus,
  issueKey,
} from "~/lib/status";

export function meta({
  data,
}: {
  data?: { task?: { title: string }; keyLabel?: string };
}) {
  const t = data?.keyLabel
    ? `${data.keyLabel} ${data?.task?.title ?? ""}`
    : "課題";
  return [{ title: `${t} | ProjectHub` }];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const db = getDb();
  const task = db.tasks.find((t) => t.id === params.id);
  if (!task) {
    throw new Response("Not Found", { status: 404 });
  }
  const project = db.projects.find((p) => p.id === task.projectId) ?? null;
  const parent = task.parentId
    ? (db.tasks.find((t) => t.id === task.parentId) ?? null)
    : null;
  const children = db.tasks.filter((t) => t.parentId === task.id);
  const comments = db.comments
    .filter((c) => c.taskId === task.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const activities = db.activities
    .filter((a) => a.taskId === task.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    task,
    project,
    parent,
    children,
    comments,
    activities,
    members: db.members,
    keyLabel: project ? issueKey(project.code, task.key) : `#${task.key}`,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  const id = params.id!;

  if (intent === "delete") {
    deleteTask(id);
    return redirect("/issues");
  }

  if (intent === "status") {
    const status = form.get("status");
    if (isTaskStatus(status)) {
      const me = await getCurrentMember(request);
      updateTask(id, { status }, me?.id);
    }
    return { ok: true };
  }

  if (intent === "comment") {
    const me = await getCurrentMember(request);
    if (!me) throw redirect("/login");
    const body = String(form.get("body") ?? "").trim();
    if (body) {
      createComment({
        taskId: id,
        authorId: me.id,
        body,
        createdAt: nowStamp(),
      });
    }
    return { ok: true };
  }

  return { ok: false };
}

function formatDateTime(s: string): string {
  const [date, time] = s.split("T");
  return time ? `${formatYMD(date)} ${time.slice(0, 5)}` : formatYMD(date);
}

export default function IssueDetail() {
  const {
    task,
    project,
    parent,
    children,
    comments,
    activities,
    members,
    keyLabel,
  } = useLoaderData<typeof loader>();
  const statusFetcher = useFetcher();

  const member = (id: string) => members.find((m) => m.id === id);
  const assignee = member(task.assigneeId);

  const currentStatus =
    statusFetcher.formData?.get("intent") === "status" &&
    isTaskStatus(statusFetcher.formData.get("status"))
      ? (statusFetcher.formData.get("status") as typeof task.status)
      : task.status;

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ minWidth: 0 }}>
          <p className="page-sub" style={{ margin: "0 0 4px" }}>
            <Link to="/issues">← 課題一覧</Link>
          </p>
          <div className="issue-head-line">
            <span className={`tchip tp-${task.type}`}>
              {TYPE_LABEL[task.type]}
            </span>
            <span className="ikey">{keyLabel}</span>
            {project && (
              <span className="muted">
                {project.name}
                {parent && (
                  <>
                    {" / 親課題: "}
                    <Link to={`/issues/${parent.id}`}>{parent.title}</Link>
                  </>
                )}
              </span>
            )}
          </div>
          <h1 className="page-title">{task.title}</h1>
          <p className="page-sub">登録日: {formatYMD(task.createdAt)}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <Link className="btn" to={`/tasks/${task.id}/edit`}>
            ✎ 編集
          </Link>
          <Form
            method="post"
            onSubmit={(e) => {
              if (!confirm("この課題を削除しますか？子課題も削除されます。")) {
                e.preventDefault();
              }
            }}
          >
            <button type="submit" name="intent" value="delete" className="btn danger">
              削除
            </button>
          </Form>
        </div>
      </div>

      <div className="issue-grid">
        <div>
          <div className="card issue-desc">
            {task.description || <span className="muted">詳細はありません。</span>}
          </div>

          {children.length > 0 && (
            <div className="card panel" style={{ marginTop: 14 }}>
              <h2>子課題</h2>
              {children.map((c) => (
                <div className="list-row" key={c.id}>
                  <span className="ikey">
                    {project ? issueKey(project.code, c.key) : ""}
                  </span>
                  <span className="grow">
                    <Link to={`/issues/${c.id}`}>{c.title}</Link>
                  </span>
                  <span className={`badge st-${c.status}`}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="card panel" style={{ marginTop: 14 }}>
            <h2>コメント ({comments.length})</h2>
            {comments.map((c) => {
              const author = member(c.authorId);
              return (
                <div className="comment" key={c.id}>
                  {author && (
                    <span
                      className="avatar"
                      style={{ background: author.color }}
                    >
                      {author.initial}
                    </span>
                  )}
                  <div className="comment-body">
                    <div className="comment-head">
                      <span className="name">{author?.name ?? "不明"}</span>
                      <span className="muted">
                        {formatDateTime(c.createdAt)}
                      </span>
                    </div>
                    <div className="comment-text">{c.body}</div>
                  </div>
                </div>
              );
            })}
            {comments.length === 0 && (
              <p className="muted">まだコメントはありません。</p>
            )}
            <Form method="post" className="comment-form">
              <input type="hidden" name="intent" value="comment" />
              <textarea
                name="body"
                rows={3}
                placeholder="コメントを書く…"
                required
              />
              <div className="row">
                <button type="submit" className="btn primary">
                  コメントする
                </button>
              </div>
            </Form>
          </div>
        </div>

        <div>
        <div className="card panel">
          <h2>プロパティ</h2>
          <table className="props">
            <tbody>
              <tr>
                <th>状態</th>
                <td>
                  <statusFetcher.Form method="post">
                    <input type="hidden" name="intent" value="status" />
                    <select
                      name="status"
                      value={currentStatus}
                      onChange={(e) => {
                        statusFetcher.submit(e.currentTarget.form);
                      }}
                      style={{
                        border: "1px solid var(--border-strong)",
                        borderRadius: 8,
                        padding: "5px 8px",
                        fontSize: 12.5,
                        fontFamily: "inherit",
                      }}
                    >
                      {STATUS_ORDER.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </statusFetcher.Form>
                </td>
              </tr>
              <tr>
                <th>担当者</th>
                <td>
                  {assignee && (
                    <span className="g-assignee" style={{ color: "inherit" }}>
                      <span
                        className="avatar"
                        style={{ background: assignee.color }}
                      >
                        {assignee.initial}
                      </span>
                      {assignee.name}
                    </span>
                  )}
                </td>
              </tr>
              <tr>
                <th>優先度</th>
                <td>
                  <span className={`prio prio-${task.priority}`}>
                    {PRIORITY_ARROW[task.priority]} {PRIORITY_LABEL[task.priority]}
                  </span>
                </td>
              </tr>
              <tr>
                <th>種別</th>
                <td>
                  <span className={`tchip tp-${task.type}`}>
                    {TYPE_LABEL[task.type]}
                  </span>
                </td>
              </tr>
              <tr>
                <th>開始日</th>
                <td>{formatYMD(task.startDate)}</td>
              </tr>
              <tr>
                <th>期限日</th>
                <td>{formatYMD(task.endDate)}</td>
              </tr>
              <tr>
                <th>案件</th>
                <td>{project && <span className="chip">{project.name}</span>}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card panel" style={{ marginTop: 14 }}>
          <h2>変更履歴</h2>
          <div className="history">
            {activities.map((a) => {
              const actor = member(a.memberId);
              return (
                <div className="history-item" key={a.id}>
                  <div className="history-line">
                    <strong>{actor?.name ?? "不明"}</strong>
                    {a.type === "create" ? (
                      <> が課題を追加</>
                    ) : (
                      <>
                        {" が "}
                        {a.from && (
                          <span className={`badge st-${a.from}`}>
                            {STATUS_LABEL[a.from]}
                          </span>
                        )}
                        {" → "}
                        {a.to && (
                          <span className={`badge st-${a.to}`}>
                            {STATUS_LABEL[a.to]}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                  <div className="muted">{formatDateTime(a.createdAt)}</div>
                </div>
              );
            })}
            {activities.length === 0 && (
              <p className="muted">履歴はまだありません。</p>
            )}
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
