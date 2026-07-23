import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import { createProject, getDb } from "~/lib/db.server";
import { formatYMD } from "~/lib/date";
import { PROJECT_STATUS_LABEL } from "~/lib/status";
import type { ProjectStatus } from "~/lib/types";

export function meta() {
  return [{ title: "案件一覧 | ProjectHub" }];
}

export async function loader() {
  const db = getDb();
  return { projects: db.projects, tasks: db.tasks };
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const code = String(form.get("code") ?? "").trim().toUpperCase();
  const client = String(form.get("client") ?? "").trim();
  const startDate = String(form.get("startDate") ?? "");
  const endDate = String(form.get("endDate") ?? "");
  const status = String(form.get("status") ?? "planned") as ProjectStatus;
  const description = String(form.get("description") ?? "").trim();

  if (!name || !code || !startDate || !endDate) {
    return { error: "必須項目が未入力です。" };
  }
  createProject({ name, code, client, status, startDate, endDate, description });
  return redirect("/projects");
}

export default function Projects() {
  const { projects, tasks } = useLoaderData<typeof loader>();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">案件一覧</h1>
          <p className="page-sub">進行中のプロジェクトと進捗状況</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>コード</th>
              <th>案件名</th>
              <th>クライアント</th>
              <th>ステータス</th>
              <th>期間</th>
              <th>課題</th>
              <th style={{ width: 220 }}>進捗</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => {
              const pTasks = tasks.filter((t) => t.projectId === p.id);
              const done = pTasks.filter((t) => t.status === "done").length;
              const pct =
                pTasks.length === 0
                  ? 0
                  : Math.round((done / pTasks.length) * 100);
              return (
                <tr key={p.id}>
                  <td>
                    <span className="chip">{p.code}</span>
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    {p.description && (
                      <div className="muted">{p.description}</div>
                    )}
                  </td>
                  <td>{p.client}</td>
                  <td>
                    <span
                      className={
                        "badge " +
                        (p.status === "active"
                          ? "st-in_progress"
                          : p.status === "done"
                            ? "st-done"
                            : "st-open")
                      }
                    >
                      {PROJECT_STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td className="muted" style={{ whiteSpace: "nowrap" }}>
                    {formatYMD(p.startDate)} 〜 {formatYMD(p.endDate)}
                  </td>
                  <td className="muted">
                    {done}/{pTasks.length}
                  </td>
                  <td>
                    <span className="progress-track" style={{ display: "flex" }}>
                      <span
                        className="progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="card collapse">
        <summary className="panel" style={{ fontWeight: 700 }}>
          ＋ 新規案件を追加
        </summary>
        <div style={{ padding: "0 18px 18px" }}>
          <Form method="post" className="form-grid">
            <div className="field">
              <label htmlFor="p-name">案件名 *</label>
              <input id="p-name" name="name" required />
            </div>
            <div className="field">
              <label htmlFor="p-code">コード *</label>
              <input id="p-code" name="code" required maxLength={6} placeholder="例: EC" />
            </div>
            <div className="field">
              <label htmlFor="p-client">クライアント</label>
              <input id="p-client" name="client" />
            </div>
            <div className="field">
              <label htmlFor="p-status">ステータス</label>
              <select id="p-status" name="status" defaultValue="planned">
                {Object.entries(PROJECT_STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-start">開始日 *</label>
              <input id="p-start" name="startDate" type="date" required />
            </div>
            <div className="field">
              <label htmlFor="p-end">終了日 *</label>
              <input id="p-end" name="endDate" type="date" required />
            </div>
            <div className="field full">
              <label htmlFor="p-desc">概要</label>
              <textarea id="p-desc" name="description" rows={2} />
            </div>
            <div className="full">
              <button type="submit" className="btn primary">
                追加する
              </button>
            </div>
          </Form>
        </div>
      </details>
    </div>
  );
}
