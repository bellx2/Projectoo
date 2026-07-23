import fs from "node:fs";
import path from "node:path";
import { addDays, toISODate, today } from "./date";
import type {
  Comment,
  Database,
  Knowledge,
  Member,
  Project,
  Task,
} from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

declare global {
  var __projecthubDb: Database | undefined;
}

function seed(): Database {
  const base = today();
  const d = (offset: number) => toISODate(addDays(base, offset));
  const dt = (offset: number, time: string) => `${d(offset)}T${time}`;

  const members = [
    { id: "m1", name: "やむぅ", initial: "Y", color: "#0e9f6e" },
    { id: "m2", name: "みなみ", initial: "M", color: "#0d9488" },
    { id: "m3", name: "かずき", initial: "K", color: "#059669" },
  ];

  const projects: Project[] = [
    {
      id: "p1",
      name: "ProjectHub開発",
      code: "PH",
      client: "社内",
      status: "active",
      startDate: d(-30),
      endDate: d(60),
      description:
        "社内向けプロジェクト管理ツールの開発。カンバン・ガントチャート・Wikiを統合する。",
    },
    {
      id: "p2",
      name: "ECサイトリニューアル",
      code: "EC",
      client: "株式会社サンプル商事",
      status: "active",
      startDate: d(-20),
      endDate: d(45),
      description:
        "既存ECサイトの全面リニューアル。決済フロー刷新と管理画面の再設計を含む。",
    },
    {
      id: "p3",
      name: "帳票OCRシステム",
      code: "OCR",
      client: "株式会社テック印刷",
      status: "active",
      startDate: d(-45),
      endDate: d(30),
      description:
        "紙帳票のOCR取り込みとレビュー画面の構築。精度検証フェーズ。",
    },
  ];

  const tasks: Task[] = [
    {
      id: "t1",
      key: 1,
      projectId: "p3",
      type: "task",
      title: "OCRレビュー画面のUI微調整",
      description: "確認ダイアログの文言と余白の調整。",
      assigneeId: "m1",
      status: "in_progress",
      priority: "medium",
      startDate: d(-6),
      endDate: d(0),
      parentId: null,
      createdAt: d(-7),
    },
    {
      id: "t2",
      key: 1,
      projectId: "p1",
      type: "task",
      title: "ダッシュボードUI方向性の確定",
      description: "情報設計とレイアウト案の確定。",
      assigneeId: "m1",
      status: "in_progress",
      priority: "high",
      startDate: d(-5),
      endDate: d(3),
      parentId: null,
      createdAt: d(-8),
    },
    {
      id: "t3",
      key: 2,
      projectId: "p1",
      type: "task",
      title: "デザイン6案の比較検討",
      description: "デザイナー提案6案のレビューと絞り込み。",
      assigneeId: "m1",
      status: "in_progress",
      priority: "medium",
      startDate: d(-5),
      endDate: d(-1),
      parentId: "t2",
      createdAt: d(-8),
    },
    {
      id: "t4",
      key: 3,
      projectId: "p1",
      type: "task",
      title: "ガントチャートの実装",
      description: "担当者別グルーピングとタイムライン描画。",
      assigneeId: "m1",
      status: "open",
      priority: "high",
      startDate: d(-2),
      endDate: d(6),
      parentId: "t2",
      createdAt: d(-8),
    },
    {
      id: "t5",
      key: 2,
      projectId: "p3",
      type: "request",
      title: "IPハッシュ方式の技術検証",
      description: "ロードバランサのセッション維持方式の検証。",
      assigneeId: "m1",
      status: "open",
      priority: "low",
      startDate: d(2),
      endDate: d(9),
      parentId: null,
      createdAt: d(-5),
    },
    {
      id: "t6",
      key: 4,
      projectId: "p1",
      type: "task",
      title: "通知機能の設計",
      description: "メンション・期限通知の仕様策定。",
      assigneeId: "m2",
      status: "open",
      priority: "medium",
      startDate: d(-3),
      endDate: d(4),
      parentId: null,
      createdAt: d(-6),
    },
    {
      id: "t7",
      key: 5,
      projectId: "p1",
      type: "task",
      title: "カンバン画面設計",
      description: "カンバンボードのUI設計一式。",
      assigneeId: "m2",
      status: "in_progress",
      priority: "high",
      startDate: d(-6),
      endDate: d(1),
      parentId: null,
      createdAt: d(-10),
    },
    {
      id: "t8",
      key: 6,
      projectId: "p1",
      type: "task",
      title: "カラム構成のワイヤー",
      description: "4カラム構成のワイヤーフレーム作成。",
      assigneeId: "m2",
      status: "done",
      priority: "medium",
      startDate: d(-6),
      endDate: d(-3),
      parentId: "t7",
      createdAt: d(-10),
    },
    {
      id: "t9",
      key: 7,
      projectId: "p1",
      type: "task",
      title: "ドラッグ挙動の定義",
      description: "カード移動時の挙動とバリデーション定義。",
      assigneeId: "m2",
      status: "resolved",
      priority: "medium",
      startDate: d(-4),
      endDate: d(0),
      parentId: "t7",
      createdAt: d(-10),
    },
    {
      id: "t10",
      key: 1,
      projectId: "p2",
      type: "task",
      title: "要件定義書レビュー",
      description: "クライアント提出前の最終レビュー。",
      assigneeId: "m3",
      status: "resolved",
      priority: "high",
      startDate: d(-8),
      endDate: d(-4),
      parentId: null,
      createdAt: d(-12),
    },
    {
      id: "t11",
      key: 2,
      projectId: "p2",
      type: "task",
      title: "消費税率テーブルの設計",
      description: "軽減税率対応のマスタ設計。",
      assigneeId: "m3",
      status: "open",
      priority: "medium",
      startDate: d(0),
      endDate: d(7),
      parentId: null,
      createdAt: d(-4),
    },
    {
      id: "t12",
      key: 3,
      projectId: "p2",
      type: "task",
      title: "権限モデル定義",
      description: "ロールと権限マトリクスの定義。",
      assigneeId: "m3",
      status: "in_progress",
      priority: "high",
      startDate: d(-2),
      endDate: d(3),
      parentId: null,
      createdAt: d(-4),
    },
    {
      id: "t13",
      key: 4,
      projectId: "p2",
      type: "task",
      title: "決済フローの実装",
      description: "クレジット決済・コンビニ決済の実装。",
      assigneeId: "m3",
      status: "open",
      priority: "high",
      startDate: d(5),
      endDate: d(14),
      parentId: null,
      createdAt: d(-3),
    },
    {
      id: "t14",
      key: 8,
      projectId: "p1",
      type: "task",
      title: "リリースノート作成",
      description: "v1.0リリースノートのドラフト。",
      assigneeId: "m2",
      status: "open",
      priority: "low",
      startDate: d(8),
      endDate: d(10),
      parentId: null,
      createdAt: d(-2),
    },
    {
      id: "t15",
      key: 9,
      projectId: "p1",
      type: "other",
      title: "開発環境セットアップ手順書",
      description: "新メンバー向けセットアップ手順の整備。",
      assigneeId: "m3",
      status: "done",
      priority: "low",
      startDate: d(-12),
      endDate: d(-9),
      parentId: null,
      createdAt: d(-14),
    },
    {
      id: "t16",
      key: 3,
      projectId: "p3",
      type: "bug",
      title: "スキャン画像の回転が反映されない",
      description:
        "90度回転した帳票画像をアップロードすると、レビュー画面で元の向きのまま表示される。\n\n再現手順:\n1. 帳票を横向きでスキャン\n2. アップロード後にレビュー画面を開く",
      assigneeId: "m1",
      status: "open",
      priority: "high",
      startDate: d(0),
      endDate: d(2),
      parentId: null,
      createdAt: d(-1),
    },
  ];

  const comments: Comment[] = [
    {
      id: "c1",
      taskId: "t2",
      authorId: "m2",
      body: "B案とD案の2案まで絞り込みました。明日の定例で最終決定したいです。",
      createdAt: dt(-2, "10:30:00"),
    },
    {
      id: "c2",
      taskId: "t2",
      authorId: "m1",
      body: "ありがとうございます。D案のサイドバー配色だけ気になっているので、定例前に代替案を1つ用意しておきます。",
      createdAt: dt(-2, "14:05:00"),
    },
    {
      id: "c3",
      taskId: "t9",
      authorId: "m2",
      body: "ドラッグ中のプレースホルダ表示について仕様をまとめました。レビューお願いします。",
      createdAt: dt(-1, "09:15:00"),
    },
    {
      id: "c4",
      taskId: "t16",
      authorId: "m1",
      body: "EXIFのOrientationを見ていないのが原因のようです。変換処理に回転補正を追加して検証します。",
      createdAt: dt(0, "09:40:00"),
    },
    {
      id: "c5",
      taskId: "t10",
      authorId: "m3",
      body: "指摘事項3件を反映済みです。処理済みにしました。",
      createdAt: dt(-4, "17:20:00"),
    },
  ];

  const knowledge: Knowledge[] = [
    {
      id: "k1",
      title: "開発環境セットアップ手順",
      body: "Bun をインストール後、リポジトリ直下で bun install を実行します。\n\n開発サーバーは bun run dev で起動し、http://localhost:5173 で確認できます。\n\nビルドは bun run build、本番起動は bun run start です。",
      tags: ["開発環境", "オンボーディング"],
      authorId: "m3",
      updatedAt: d(-9),
    },
    {
      id: "k2",
      title: "コーディング規約",
      body: "TypeScript は strict モードを前提とします。\n\nコンポーネントは app/routes 配下に配置し、共有ロジックは app/lib にまとめます。\n\n命名はキャメルケース、定数は大文字スネークケースを使用します。",
      tags: ["規約", "TypeScript"],
      authorId: "m1",
      updatedAt: d(-15),
    },
    {
      id: "k3",
      title: "ステータス運用ルール",
      body: "未対応: 着手前の課題。\n処理中: 作業中の課題。\n処理済み: 作業完了・レビュー待ち。\n完了: レビュー承認済み。\n\n処理済みのままレビューが3日以上滞留した場合は朝会で共有してください。",
      tags: ["運用", "ルール"],
      authorId: "m2",
      updatedAt: d(-4),
    },
    {
      id: "k4",
      title: "リリース手順",
      body: "1. main ブランチで bun run build を実行\n2. ステージング環境で動作確認\n3. リリースノートを更新\n4. 本番デプロイ後、ダッシュボードの表示とカンバン操作を確認\n\nロールバックは直前タグへの再デプロイで行います。",
      tags: ["リリース", "運用"],
      authorId: "m3",
      updatedAt: d(-2),
    },
  ];

  return { members, projects, tasks, comments, knowledge };
}

// 旧フォーマットの db.json を読んだ場合に不足フィールドを補完する
function migrate(db: Database): Database {
  if (!db.comments) db.comments = [];
  const counters = new Map<string, number>();
  for (const t of db.tasks) {
    if (typeof t.key === "number") {
      counters.set(t.projectId, Math.max(counters.get(t.projectId) ?? 0, t.key));
    }
  }
  for (const t of db.tasks) {
    if (typeof t.key !== "number") {
      const next = (counters.get(t.projectId) ?? 0) + 1;
      counters.set(t.projectId, next);
      t.key = next;
    }
    if (!t.type) t.type = "task";
    if (!t.createdAt) t.createdAt = t.startDate;
  }
  return db;
}

function load(): Database {
  if (fs.existsSync(DB_PATH)) {
    try {
      return migrate(JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Database);
    } catch {
      // 壊れたファイルはシードで作り直す
    }
  }
  const db = seed();
  persist(db);
  return db;
}

function persist(db: Database) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function getDb(): Database {
  if (!globalThis.__projecthubDb) {
    globalThis.__projecthubDb = load();
  }
  return globalThis.__projecthubDb;
}

function save() {
  const db = getDb();
  persist(db);
}

let seq = 0;
export function newId(prefix: string): string {
  seq += 1;
  return `${prefix}${Date.now().toString(36)}${seq}`;
}

function nextKey(db: Database, projectId: string): number {
  return (
    db.tasks
      .filter((t) => t.projectId === projectId)
      .reduce((max, t) => Math.max(max, t.key), 0) + 1
  );
}

export function createTask(input: Omit<Task, "id" | "key">): Task {
  const db = getDb();
  const task: Task = {
    ...input,
    id: newId("t"),
    key: nextKey(db, input.projectId),
  };
  db.tasks.push(task);
  save();
  return task;
}

export function updateTask(
  id: string,
  patch: Partial<Omit<Task, "id" | "key">>,
): Task | null {
  const db = getDb();
  const task = db.tasks.find((t) => t.id === id);
  if (!task) return null;
  // 案件をまたいで移動した場合はキーを採番し直す
  if (patch.projectId && patch.projectId !== task.projectId) {
    task.key = nextKey(db, patch.projectId);
  }
  Object.assign(task, patch);
  save();
  return task;
}

export function deleteTask(id: string) {
  const db = getDb();
  const removed = new Set(
    db.tasks.filter((t) => t.id === id || t.parentId === id).map((t) => t.id),
  );
  db.tasks = db.tasks.filter((t) => !removed.has(t.id));
  db.comments = db.comments.filter((c) => !removed.has(c.taskId));
  save();
}

export function createComment(input: Omit<Comment, "id">): Comment {
  const db = getDb();
  const comment: Comment = { ...input, id: newId("c") };
  db.comments.push(comment);
  save();
  return comment;
}

export function createMember(input: Omit<Member, "id">): Member {
  const db = getDb();
  const member: Member = { ...input, id: newId("m") };
  db.members.push(member);
  save();
  return member;
}

export function deleteMember(id: string) {
  const db = getDb();
  db.members = db.members.filter((m) => m.id !== id);
  save();
}

export function createProject(input: Omit<Project, "id">): Project {
  const db = getDb();
  const project: Project = { ...input, id: newId("p") };
  db.projects.push(project);
  save();
  return project;
}

export function createKnowledge(input: Omit<Knowledge, "id">): Knowledge {
  const db = getDb();
  const article: Knowledge = { ...input, id: newId("k") };
  db.knowledge.unshift(article);
  save();
  return article;
}

export function deleteKnowledge(id: string) {
  const db = getDb();
  db.knowledge = db.knowledge.filter((k) => k.id !== id);
  save();
}
