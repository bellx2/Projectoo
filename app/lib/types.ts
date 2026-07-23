export type TaskStatus = "open" | "in_progress" | "resolved" | "done";
export type Priority = "high" | "medium" | "low";
export type ProjectStatus = "planned" | "active" | "done";

export interface Member {
  id: string;
  name: string;
  initial: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  client: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  startDate: string;
  endDate: string;
  parentId: string | null;
}

export interface Knowledge {
  id: string;
  title: string;
  body: string;
  tags: string[];
  authorId: string;
  updatedAt: string;
}

export interface Database {
  members: Member[];
  projects: Project[];
  tasks: Task[];
  knowledge: Knowledge[];
}
