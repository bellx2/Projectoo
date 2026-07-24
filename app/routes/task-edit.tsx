import {
  redirect,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { TaskForm } from "~/components/TaskForm";
import { deleteTask, getDb, updateTask } from "~/lib/db.server";
import { requireMember } from "~/lib/session.server";
import type { Priority, TaskStatus } from "~/lib/types";
import { isIssueType, isTaskStatus } from "~/lib/status";

export function meta() {
  return [{ title: "課題の編集 | ProjectHub" }];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const db = getDb();
  const task = db.tasks.find((t) => t.id === params.id);
  if (!task) {
    throw new Response("Not Found", { status: 404 });
  }
  const hasChildren = db.tasks.some((t) => t.parentId === task.id);
  return {
    task,
    members: db.members,
    projects: db.projects,
    // 子課題を持つ課題は親を設定できない (2階層まで)
    parentCandidates: hasChildren
      ? []
      : db.tasks.filter((t) => t.parentId === null && t.id !== task.id),
    hasChildren,
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const me = await requireMember(request);
  const form = await request.formData();
  const id = params.id!;

  if (form.get("intent") === "delete") {
    deleteTask(id);
    return redirect("/gantt");
  }

  const title = String(form.get("title") ?? "").trim();
  const startDate = String(form.get("startDate") ?? "");
  const endDate = String(form.get("endDate") ?? "");
  const statusRaw = form.get("status");
  const status: TaskStatus = isTaskStatus(statusRaw) ? statusRaw : "open";

  if (!title || !startDate || !endDate) {
    return { error: "件名と期間は必須です。" };
  }
  if (endDate < startDate) {
    return { error: "終了日は開始日以降にしてください。" };
  }

  // 親課題は「親を持たない・自分以外」の課題だけ許可 (2階層まで)。
  // 自分が子課題を持つ場合は親を設定できない。
  const db = getDb();
  const parentId = String(form.get("parentId") ?? "") || null;
  if (parentId) {
    const parent = db.tasks.find((t) => t.id === parentId);
    const hasChildren = db.tasks.some((t) => t.parentId === id);
    if (!parent || parent.parentId !== null || parent.id === id || hasChildren) {
      return { error: "指定した親課題は親に設定できません。" };
    }
  }

  const typeRaw = form.get("type");
  updateTask(id, {
    title,
    description: String(form.get("description") ?? ""),
    projectId: String(form.get("projectId") ?? ""),
    type: isIssueType(typeRaw) ? typeRaw : "task",
    assigneeId: String(form.get("assigneeId") ?? ""),
    status,
    priority: (String(form.get("priority") ?? "medium") as Priority),
    startDate,
    endDate,
    parentId,
  }, me.id);
  return redirect(`/issues/${id}`);
}

export default function TaskEdit() {
  const { task, members, projects, parentCandidates, hasChildren } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">課題の編集</h1>
          <p className="page-sub">{task.title}</p>
        </div>
      </div>
      <TaskForm
        task={task}
        members={members}
        projects={projects}
        parentCandidates={parentCandidates}
        error={actionData?.error}
        showDelete
        hasChildren={hasChildren}
      />
    </div>
  );
}
