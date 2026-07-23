import { useState } from "react";
import {
  Link,
  useFetcher,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import { createTask, getDb, updateTask } from "~/lib/db.server";
import { getCurrentMember } from "~/lib/session.server";
import { addDays, formatMD, parseISODate, toISODate, today } from "~/lib/date";
import {
  PRIORITY_ARROW,
  PRIORITY_LABEL,
  STATUS_LABEL,
  STATUS_ORDER,
  TYPE_LABEL,
  isTaskStatus,
  issueKey,
} from "~/lib/status";
import type { Task, TaskStatus } from "~/lib/types";

export function meta() {
  return [{ title: "カンバンボード | ProjectHub" }];
}

export async function loader() {
  const db = getDb();
  return { members: db.members, projects: db.projects, tasks: db.tasks };
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");

  if (intent === "move") {
    const taskId = String(form.get("taskId") ?? "");
    const status = form.get("status");
    if (taskId && isTaskStatus(status)) {
      const me = await getCurrentMember(request);
      updateTask(taskId, { status }, me?.id);
    }
    return { ok: true };
  }

  if (intent === "create") {
    const title = String(form.get("title") ?? "").trim();
    const status = form.get("status");
    if (title && isTaskStatus(status)) {
      const db = getDb();
      const me = await getCurrentMember(request);
      const base = today();
      createTask({
        title,
        description: "",
        projectId: db.projects[0]?.id ?? "",
        type: "task",
        assigneeId: me?.id ?? db.members[0]?.id ?? "",
        status,
        priority: "medium",
        startDate: toISODate(base),
        endDate: toISODate(addDays(base, 3)),
        parentId: null,
        createdAt: toISODate(base),
      }, me?.id);
    }
    return { ok: true };
  }

  return { ok: false };
}

export default function Kanban() {
  const { members, projects, tasks } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const todayStr = toISODate(today());

  // 楽観的更新: 移動中のタスクは移動先カラムに表示する
  const pendingMove =
    fetcher.formData?.get("intent") === "move"
      ? {
          taskId: String(fetcher.formData.get("taskId")),
          status: fetcher.formData.get("status") as TaskStatus,
        }
      : null;

  const effectiveStatus = (t: Task): TaskStatus =>
    pendingMove && pendingMove.taskId === t.id ? pendingMove.status : t.status;

  const move = (taskId: string, status: TaskStatus) => {
    fetcher.submit({ intent: "move", taskId, status }, { method: "post" });
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">カンバンボード</h1>
          <p className="page-sub">
            カードをドラッグしてステータスを更新できます
          </p>
        </div>
        <Link className="btn primary" to="/tasks/new">
          ＋ 課題を追加
        </Link>
      </div>

      <div className="kanban">
        {STATUS_ORDER.map((status) => {
          const cards = tasks
            .filter((t) => effectiveStatus(t) === status)
            .sort((a, b) => a.endDate.localeCompare(b.endDate));
          return (
            <div
              key={status}
              className={
                "kanban-col" + (dragOver === status ? " drag-over" : "")
              }
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(status);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const taskId = e.dataTransfer.getData("text/task-id");
                if (taskId) move(taskId, status);
              }}
            >
              <div className="kanban-col-head">
                <span
                  className="legend-dot"
                  style={{
                    background: `var(--status-${status.replace("_", "-")})`,
                  }}
                />
                {STATUS_LABEL[status]}
                <span className="count">{cards.length}</span>
              </div>
              <div className="kanban-cards">
                {cards.map((task) => {
                  const project = projects.find((p) => p.id === task.projectId);
                  const member = members.find((m) => m.id === task.assigneeId);
                  const overdue =
                    task.endDate < todayStr && effectiveStatus(task) !== "done";
                  return (
                    <div
                      key={task.id}
                      className="kcard"
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/task-id", task.id)
                      }
                    >
                      <div
                        className="issue-head-line"
                        style={{ marginBottom: 2 }}
                      >
                        <span className={`tchip tp-${task.type}`}>
                          {TYPE_LABEL[task.type]}
                        </span>
                        <span className="ikey">
                          {project ? issueKey(project.code, task.key) : ""}
                        </span>
                      </div>
                      <div className="kcard-title">
                        <Link to={`/issues/${task.id}`}>{task.title}</Link>
                      </div>
                      <div className="kcard-meta">
                        <span className="left">
                          <span className={"muted" + (overdue ? " overdue" : "")}>
                            〜{formatMD(task.endDate)}
                          </span>
                          <span
                            className={`prio prio-${task.priority}`}
                            title={`優先度: ${PRIORITY_LABEL[task.priority]}`}
                          >
                            {PRIORITY_ARROW[task.priority]}
                          </span>
                        </span>
                        {member && (
                          <span
                            className="avatar"
                            style={{ background: member.color }}
                            title={member.name}
                          >
                            {member.initial}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <fetcher.Form method="post" className="kanban-add">
                <input type="hidden" name="intent" value="create" />
                <input type="hidden" name="status" value={status} />
                <input
                  name="title"
                  placeholder="＋ カードを追加"
                  autoComplete="off"
                  required
                />
                <button type="submit" className="btn small">
                  追加
                </button>
              </fetcher.Form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
