import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/dashboard.tsx"),
  route("kanban", "routes/kanban.tsx"),
  route("gantt", "routes/gantt.tsx"),
  route("gantt/export", "routes/gantt-export.ts"),
  route("projects", "routes/projects.tsx"),
  route("knowledge", "routes/knowledge.tsx"),
  route("knowledge/:id", "routes/knowledge-detail.tsx"),
  route("issues", "routes/issues.tsx"),
  route("tasks/new", "routes/task-new.tsx"),
  route("tasks/:id/edit", "routes/task-edit.tsx"),
] satisfies RouteConfig;
