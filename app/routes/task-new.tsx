import {
  redirect,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { TaskForm } from "~/components/TaskForm";
import { createTask, getDb } from "~/lib/db.server";
import { getCurrentMember } from "~/lib/session.server";
import { toISODate, today } from "~/lib/date";
import type { Priority, TaskStatus } from "~/lib/types";
import { isIssueType, isTaskStatus } from "~/lib/status";

export function meta() {
  return [{ title: "課題の追加 | ProjectHub" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const db = getDb();
  const me = await getCurrentMember(request);
  return {
    members: db.members,
    projects: db.projects,
    parentCandidates: db.tasks.filter((t) => t.parentId === null),
    defaultAssigneeId: me?.id,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
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

  const me = await getCurrentMember(request);
  const typeRaw = form.get("type");
  const task = createTask({
    title,
    description: String(form.get("description") ?? ""),
    projectId: String(form.get("projectId") ?? ""),
    type: isIssueType(typeRaw) ? typeRaw : "task",
    assigneeId: String(form.get("assigneeId") ?? ""),
    status,
    priority: (String(form.get("priority") ?? "medium") as Priority),
    startDate,
    endDate,
    parentId: String(form.get("parentId") ?? "") || null,
    createdAt: toISODate(today()),
  }, me?.id);
  return redirect(`/issues/${task.id}`);
}

export default function TaskNew() {
  const { members, projects, parentCandidates, defaultAssigneeId } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">課題の追加</h1>
          <p className="page-sub">新しい課題を登録します</p>
        </div>
      </div>
      <TaskForm
        members={members}
        projects={projects}
        parentCandidates={parentCandidates}
        error={actionData?.error}
        defaultAssigneeId={defaultAssigneeId}
      />
    </div>
  );
}
