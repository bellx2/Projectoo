# ProjectHub

Bun + React Router v7 (framework mode) で構築した、シンプルな Backlog 風プロジェクト管理ツール。

## 機能

- **簡易ログイン** — パスワードなしで自分のメンバーを選んでログイン (Cookie セッション、30日)。コメント・Wiki は自動的にログインユーザー名義になり、課題の担当者もデフォルトで自分になります
- **メンバー管理** — メンバーの追加 (名前 / イニシャル / カラー) と削除。担当課題・コメント・Wiki記事を持つメンバーと最後の1人は削除不可
- **課題管理 (Backlog 風)** — 課題キー (`PH-1` 形式)、種別 (タスク / バグ / 要望 / その他)、優先度 (↑高 / →中 / ↓低)、親子課題
- **課題詳細ページ** — プロパティパネル、状態のクイック変更、コメントスレッド、変更履歴
- **変更履歴 (アクティビティ)** — 課題の作成・ステータス変更を「誰が・いつ・何を」で自動記録
- **週報の自動生成** — 週と対象者を選ぶと、履歴・コメントから「今週やったこと / 進行中 / 来週の予定 / 課題・相談」を自動集計。「全員」でチーム週報、Markdown コピーで Slack やメールにそのまま貼り付け可能
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
    session.server.ts # ログインセッション (Cookie)
    date.ts / status.ts
  components/
    TaskForm.tsx      # 課題フォーム (新規/編集 共通)
  routes/
    login.tsx         # /login, logout.ts
    members.tsx       # /members
    dashboard.tsx     # /
    kanban.tsx        # /kanban
    gantt.tsx         # /gantt
    gantt-export.ts   # /gantt/export (CSV)
    projects.tsx      # /projects
    knowledge.tsx     # /knowledge (Wiki), knowledge-detail.tsx
    issues.tsx        # /issues
    issue-detail.tsx  # /issues/:id (詳細 + コメント + 履歴)
    report.tsx        # /report (週報自動生成)
    task-new.tsx      # /tasks/new, task-edit.tsx
```
