import {
  Form,
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { getDb } from "~/lib/db.server";
import { formatMD, toISODate, today } from "~/lib/date";
import {
  PRIORITY_ARROW,
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  TYPE_LABEL,
  issueKey,
} from "~/lib/status";

export function meta() {
  return [{ title: "課題 | ProjectHub" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("project") ?? "";
  const status = url.searchParams.get("status") ?? "";
  const assigneeId = url.searchParams.get("assignee") ?? "";
  const q = url.searchParams.get("q") ?? "";

  const db = getDb();
  let tasks = [...db.tasks];
  if (projectId) tasks = tasks.filter((t) => t.projectId === projectId);
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (assigneeId) tasks = tasks.filter((t) => t.assigneeId === assigneeId);
  if (q) {
    const needle = q.toLowerCase();
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        t.description.toLowerCase().includes(needle),
    );
  }
  tasks.sort((a, b) => a.endDate.localeCompare(b.endDate));

  return {
    tasks,
    members: db.members,
    projects: db.projects,
    filters: { projectId, status, assigneeId, q },
    todayStr: toISODate(today()),
  };
}

export default function Issues() {
  const { tasks, members, projects, filters, todayStr } =
    useLoaderData<typeof loader>();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">課題</h1>
          <p className="page-sub">全案件の課題を検索・絞り込みできます</p>
        </div>
        <Link className="btn primary" to="/tasks/new">
          ＋ 課題を追加
        </Link>
      </div>

      <Form method="get" className="toolbar">
        <select name="project" defaultValue={filters.projectId}>
          <option value="">すべての案件</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={filters.status}>
          <option value="">すべての状態</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <select name="assignee" defaultValue={filters.assigneeId}>
          <option value="">すべての担当者</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          name="q"
          placeholder="キーワード検索"
          defaultValue={filters.q}
        />
        <button type="submit" className="btn">
          絞り込む
        </button>
      </Form>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>キー</th>
              <th>種別</th>
              <th>件名</th>
              <th>担当者</th>
              <th>優先度</th>
              <th>状態</th>
              <th>期限日</th>
              <th>登録日</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const p = projects.find((x) => x.id === t.projectId);
              const m = members.find((x) => x.id === t.assigneeId);
              const overdue = t.endDate < todayStr && t.status !== "done";
              return (
                <tr key={t.id}>
                  <td>
                    <Link className="ikey" to={`/issues/${t.id}`}>
                      {p ? issueKey(p.code, t.key) : `#${t.key}`}
                    </Link>
                  </td>
                  <td>
                    <span className={`tchip tp-${t.type}`}>
                      {TYPE_LABEL[t.type]}
                    </span>
                  </td>
                  <td>
                    <Link to={`/issues/${t.id}`}>{t.title}</Link>
                    {t.parentId && <span className="muted"> (子課題)</span>}
                  </td>
                  <td>
                    {m && (
                      <span className="g-assignee">
                        <span
                          className="avatar"
                          style={{ background: m.color }}
                        >
                          {m.initial}
                        </span>
                        {m.name}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`prio prio-${t.priority}`}>
                      {PRIORITY_ARROW[t.priority]} {PRIORITY_LABEL[t.priority]}
                    </span>
                  </td>
                  <td>
                    <span className={`badge st-${t.status}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td
                    className={"muted" + (overdue ? " overdue" : "")}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {formatMD(t.endDate)}
                  </td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {formatMD(t.createdAt)}
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={8} className="muted">
                  条件に一致する課題はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
