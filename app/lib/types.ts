export type TaskStatus = "open" | "in_progress" | "resolved" | "done";
export type Priority = "high" | "medium" | "low";
export type ProjectStatus = "planned" | "active" | "done";
export type IssueType = "task" | "bug" | "request" | "other";

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
  key: number;
  projectId: string;
  type: IssueType;
  title: string;
  description: string;
  assigneeId: string;
  status: TaskStatus;
  priority: Priority;
  startDate: string;
  endDate: string;
  parentId: string | null;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  taskId: string;
  memberId: string;
  type: "create" | "status";
  from?: TaskStatus;
  to?: TaskStatus;
  createdAt: string;
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
  comments: Comment[];
  activities: Activity[];
  knowledge: Knowledge[];
}
