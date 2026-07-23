import {
  redirect,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { TaskForm } from "~/components/TaskForm";
import { deleteTask, getDb, updateTask } from "~/lib/db.server";
import type { Priority, TaskStatus } from "~/lib/types";
import { isTaskStatus } from "~/lib/status";

export function meta() {
  return [{ title: "課題の編集 | ProjectHub" }];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const db = getDb();
  const task = db.tasks.find((t) => t.id === params.id);
  if (!task) {
    throw new Response("Not Found", { status: 404 });
  }
  return {
    task,
    members: db.members,
    projects: db.projects,
    parentCandidates: db.tasks.filter(
      (t) => t.parentId === null && t.id !== task.id,
    ),
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
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

  updateTask(id, {
    title,
    description: String(form.get("description") ?? ""),
    projectId: String(form.get("projectId") ?? ""),
    assigneeId: String(form.get("assigneeId") ?? ""),
    status,
    priority: (String(form.get("priority") ?? "medium") as Priority),
    startDate,
    endDate,
    parentId: String(form.get("parentId") ?? "") || null,
  });
  return redirect("/gantt");
}

export default function TaskEdit() {
  const { task, members, projects, parentCandidates } =
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
      />
    </div>
  );
}
