import {
  Form,
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import { getDb } from "~/lib/db.server";
import { formatMD, toISODate, today } from "~/lib/date";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
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
              <th>件名</th>
              <th>案件</th>
              <th>担当者</th>
              <th>優先度</th>
              <th>状態</th>
              <th>期間</th>
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
                    <Link to={`/tasks/${t.id}/edit`}>{t.title}</Link>
                    {t.parentId && <span className="muted"> (子課題)</span>}
                  </td>
                  <td>{p && <span className="chip">{p.code}</span>}</td>
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
                    <span className={`badge pr-${t.priority}`}>
                      {PRIORITY_LABEL[t.priority]}
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
                    {formatMD(t.startDate)} 〜 {formatMD(t.endDate)}
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="muted">
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
