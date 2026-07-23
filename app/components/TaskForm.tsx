import { Form } from "react-router";
import {
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  TYPE_LABEL,
} from "~/lib/status";
import type { Member, Project, Task } from "~/lib/types";

export function TaskForm({
  task,
  members,
  projects,
  parentCandidates,
  error,
  showDelete,
}: {
  task?: Task;
  members: Member[];
  projects: Project[];
  parentCandidates: Task[];
  error?: string;
  showDelete?: boolean;
}) {
  return (
    <div className="card panel" style={{ maxWidth: 760 }}>
      {error && (
        <p className="overdue" style={{ marginTop: 0 }}>
          {error}
        </p>
      )}
      <Form method="post" className="form-grid">
        <div className="field full">
          <label htmlFor="t-title">件名 *</label>
          <input id="t-title" name="title" defaultValue={task?.title} required />
        </div>
        <div className="field">
          <label htmlFor="t-project">案件 *</label>
          <select id="t-project" name="projectId" defaultValue={task?.projectId}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-assignee">担当者 *</label>
          <select id="t-assignee" name="assigneeId" defaultValue={task?.assigneeId}>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-type">種別</label>
          <select id="t-type" name="type" defaultValue={task?.type ?? "task"}>
            {Object.entries(TYPE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-status">ステータス</label>
          <select id="t-status" name="status" defaultValue={task?.status ?? "open"}>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-priority">優先度</label>
          <select
            id="t-priority"
            name="priority"
            defaultValue={task?.priority ?? "medium"}
          >
            {Object.entries(PRIORITY_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="t-start">開始日 *</label>
          <input
            id="t-start"
            name="startDate"
            type="date"
            defaultValue={task?.startDate}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="t-end">終了日 *</label>
          <input
            id="t-end"
            name="endDate"
            type="date"
            defaultValue={task?.endDate}
            required
          />
        </div>
        <div className="field full">
          <label htmlFor="t-parent">親課題</label>
          <select id="t-parent" name="parentId" defaultValue={task?.parentId ?? ""}>
            <option value="">なし</option>
            {parentCandidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field full">
          <label htmlFor="t-desc">詳細</label>
          <textarea
            id="t-desc"
            name="description"
            rows={4}
            defaultValue={task?.description}
          />
        </div>
        <div className="form-actions full">
          <button type="submit" name="intent" value="save" className="btn primary">
            {task ? "保存する" : "追加する"}
          </button>
          {showDelete && (
            <button
              type="submit"
              name="intent"
              value="delete"
              className="btn danger"
              formNoValidate
              onClick={(e) => {
                if (!confirm("この課題を削除しますか？子課題も削除されます。")) {
                  e.preventDefault();
                }
              }}
            >
              削除する
            </button>
          )}
        </div>
      </Form>
    </div>
  );
}
