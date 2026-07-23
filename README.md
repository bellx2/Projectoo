# ProjectHub

Bun + React Router v7 (framework mode) で構築した、シンプルな Backlog 風プロジェクト管理ツール。

## 機能

- **課題管理 (Backlog 風)** — 課題キー (`PH-1` 形式)、種別 (タスク / バグ / 要望 / その他)、優先度 (↑高 / →中 / ↓低)、親子課題
- **課題詳細ページ** — プロパティパネル、状態のクイック変更、コメントスレッド
- **ダッシュボード** — 課題数・完了率・期限超過などのサマリー、案件別進捗、最近の更新 (コメントフィード)
- **カンバンボード** — 未対応 / 処理中 / 処理済み / 完了 の4カラム。ドラッグ&ドロップでステータス更新、カラム内でのクイック追加
- **ガントチャート** — 担当者別グルーピング、親子課題の折りたたみ、今日・週末のハイライト、表示設定、CSV(Excel)出力
- **案件一覧** — 案件ごとの進捗・期間・課題数、新規案件の追加
- **Wiki** — 手順書・ルールの共有。タグ・キーワード検索、記事の作成・削除
- **課題一覧** — 全案件横断の課題テーブル。案件 / 状態 / 担当者 / キーワードで絞り込み

ステータスカラーは Backlog 風 (未対応=赤 / 処理中=青 / 処理済み=緑 / 完了=黄緑) です。

## 起動方法

```bash
bun install
bun run dev      # 開発サーバー (http://localhost:5173)
```

```bash
bun run build    # 本番ビルド
bun run start    # 本番サーバー起動
```

## データ

初回起動時に `data/db.json` にサンプルデータが生成され、以降の変更はこのファイルに永続化されます。
初期状態に戻したい場合は `data/db.json` を削除して再起動してください。

## 構成

```
app/
  root.tsx            # レイアウト (サイドバー)
  app.css             # スタイル
  routes.ts           # ルート定義
  lib/
    types.ts          # 型定義
    db.server.ts      # JSONファイル永続化ストア + シードデータ
    date.ts / status.ts
  components/
    TaskForm.tsx      # 課題フォーム (新規/編集 共通)
  routes/
    dashboard.tsx     # /
    kanban.tsx        # /kanban
    gantt.tsx         # /gantt
    gantt-export.ts   # /gantt/export (CSV)
    projects.tsx      # /projects
    knowledge.tsx     # /knowledge (Wiki), knowledge-detail.tsx
    issues.tsx        # /issues
    issue-detail.tsx  # /issues/:id (詳細 + コメント)
    task-new.tsx      # /tasks/new, task-edit.tsx
```
