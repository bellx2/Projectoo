import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.ts"),
  route("members", "routes/members.tsx"),
  index("routes/dashboard.tsx"),
  route("kanban", "routes/kanban.tsx"),
  route("gantt", "routes/gantt.tsx"),
  route("gantt/export", "routes/gantt-export.ts"),
  route("projects", "routes/projects.tsx"),
  route("knowledge", "routes/knowledge.tsx"),
  route("knowledge/:id", "routes/knowledge-detail.tsx"),
  route("issues", "routes/issues.tsx"),
  route("issues/:id", "routes/issue-detail.tsx"),
  route("report", "routes/report.tsx"),
  route("tasks/new", "routes/task-new.tsx"),
  route("tasks/:id/edit", "routes/task-edit.tsx"),
] satisfies RouteConfig;
