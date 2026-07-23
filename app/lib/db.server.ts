import fs from "node:fs";
import path from "node:path";
import { addDays, toISODate, today } from "./date";
import type {
  Database,
  Knowledge,
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
        "社内向けプロジェクト管理ツールの開発。カンバン・ガントチャート・ナレッジ共有を統合する。",
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
      projectId: "p3",
      title: "OCRレビュー画面のUI微調整",
      description: "確認ダイアログの文言と余白の調整。",
      assigneeId: "m1",
      status: "in_progress",
      priority: "medium",
      startDate: d(-6),
      endDate: d(0),
      parentId: null,
    },
    {
      id: "t2",
      projectId: "p1",
      title: "ダッシュボードUI方向性の確定",
      description: "情報設計とレイアウト案の確定。",
      assigneeId: "m1",
      status: "in_progress",
      priority: "high",
      startDate: d(-5),
      endDate: d(3),
      parentId: null,
    },
    {
      id: "t3",
      projectId: "p1",
      title: "デザイン6案の比較検討",
      description: "デザイナー提案6案のレビューと絞り込み。",
      assigneeId: "m1",
      status: "in_progress",
      priority: "medium",
      startDate: d(-5),
      endDate: d(-1),
      parentId: "t2",
    },
    {
      id: "t4",
      projectId: "p1",
      title: "ガントチャートの実装",
      description: "担当者別グルーピングとタイムライン描画。",
      assigneeId: "m1",
      status: "open",
      priority: "high",
      startDate: d(-2),
      endDate: d(6),
      parentId: "t2",
    },
    {
      id: "t5",
      projectId: "p3",
      title: "IPハッシュ方式の技術検証",
      description: "ロードバランサのセッション維持方式の検証。",
      assigneeId: "m1",
      status: "open",
      priority: "low",
      startDate: d(2),
      endDate: d(9),
      parentId: null,
    },
    {
      id: "t6",
      projectId: "p1",
      title: "通知機能の設計",
      description: "メンション・期限通知の仕様策定。",
      assigneeId: "m2",
      status: "open",
      priority: "medium",
      startDate: d(-3),
      endDate: d(4),
      parentId: null,
    },
    {
      id: "t7",
      projectId: "p1",
      title: "カンバン画面設計",
      description: "カンバンボードのUI設計一式。",
      assigneeId: "m2",
      status: "in_progress",
      priority: "high",
      startDate: d(-6),
      endDate: d(1),
      parentId: null,
    },
    {
      id: "t8",
      projectId: "p1",
      title: "カラム構成のワイヤー",
      description: "4カラム構成のワイヤーフレーム作成。",
      assigneeId: "m2",
      status: "done",
      priority: "medium",
      startDate: d(-6),
      endDate: d(-3),
      parentId: "t7",
    },
    {
      id: "t9",
      projectId: "p1",
      title: "ドラッグ挙動の定義",
      description: "カード移動時の挙動とバリデーション定義。",
      assigneeId: "m2",
      status: "resolved",
      priority: "medium",
      startDate: d(-4),
      endDate: d(0),
      parentId: "t7",
    },
    {
      id: "t10",
      projectId: "p2",
      title: "要件定義書レビュー",
      description: "クライアント提出前の最終レビュー。",
      assigneeId: "m3",
      status: "resolved",
      priority: "high",
      startDate: d(-8),
      endDate: d(-4),
      parentId: null,
    },
    {
      id: "t11",
      projectId: "p2",
      title: "消費税率テーブルの設計",
      description: "軽減税率対応のマスタ設計。",
      assigneeId: "m3",
      status: "open",
      priority: "medium",
      startDate: d(0),
      endDate: d(7),
      parentId: null,
    },
    {
      id: "t12",
      projectId: "p2",
      title: "権限モデル定義",
      description: "ロールと権限マトリクスの定義。",
      assigneeId: "m3",
      status: "in_progress",
      priority: "high",
      startDate: d(-2),
      endDate: d(3),
      parentId: null,
    },
    {
      id: "t13",
      projectId: "p2",
      title: "決済フローの実装",
      description: "クレジット決済・コンビニ決済の実装。",
      assigneeId: "m3",
      status: "open",
      priority: "high",
      startDate: d(5),
      endDate: d(14),
      parentId: null,
    },
    {
      id: "t14",
      projectId: "p1",
      title: "リリースノート作成",
      description: "v1.0リリースノートのドラフト。",
      assigneeId: "m2",
      status: "open",
      priority: "low",
      startDate: d(8),
      endDate: d(10),
      parentId: null,
    },
    {
      id: "t15",
      projectId: "p1",
      title: "開発環境セットアップ手順書",
      description: "新メンバー向けセットアップ手順の整備。",
      assigneeId: "m3",
      status: "done",
      priority: "low",
      startDate: d(-12),
      endDate: d(-9),
      parentId: null,
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
      body: "未対応: 着手前のタスク。\n処理中: 作業中のタスク。\n処理済み: 作業完了・レビュー待ち。\n完了: レビュー承認済み。\n\n処理済みのままレビューが3日以上滞留した場合は朝会で共有してください。",
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

  return { members, projects, tasks, knowledge };
}

function load(): Database {
  if (fs.existsSync(DB_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(DB_PATH, "utf-8")) as Database;
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

export function createTask(input: Omit<Task, "id">): Task {
  const db = getDb();
  const task: Task = { ...input, id: newId("t") };
  db.tasks.push(task);
  save();
  return task;
}

export function updateTask(id: string, patch: Partial<Omit<Task, "id">>): Task | null {
  const db = getDb();
  const task = db.tasks.find((t) => t.id === id);
  if (!task) return null;
  Object.assign(task, patch);
  save();
  return task;
}

export function deleteTask(id: string) {
  const db = getDb();
  db.tasks = db.tasks.filter((t) => t.id !== id && t.parentId !== id);
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
