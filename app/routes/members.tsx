import {
  Form,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import { createMember, deleteMember, getDb } from "~/lib/db.server";
import { requireMember } from "~/lib/session.server";

export function meta() {
  return [{ title: "メンバー | ProjectHub" }];
}

const COLORS = [
  "#0e9f6e",
  "#0d9488",
  "#059669",
  "#4488c5",
  "#8f7ee6",
  "#e87758",
  "#d9822b",
  "#c5488f",
];

export async function loader() {
  const db = getDb();
  return {
    members: db.members,
    teams: db.teams,
    tasks: db.tasks,
    comments: db.comments,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  await requireMember(request);
  const form = await request.formData();
  const intent = form.get("intent");
  const db = getDb();

  if (intent === "create") {
    const name = String(form.get("name") ?? "").trim();
    const initialInput = String(form.get("initial") ?? "").trim();
    const color = String(form.get("color") ?? COLORS[0]);
    if (!name) {
      return { error: "名前を入力してください。" };
    }
    const initial = (initialInput || name).slice(0, 1).toUpperCase();
    createMember({ name, initial, color });
    return { ok: true };
  }

  if (intent === "delete") {
    const id = String(form.get("memberId") ?? "");
    if (db.members.length <= 1) {
      return { error: "最後のメンバーは削除できません。" };
    }
    const hasTasks = db.tasks.some((t) => t.assigneeId === id);
    const hasComments = db.comments.some((c) => c.authorId === id);
    const hasKnowledge = db.knowledge.some((k) => k.authorId === id);
    const hasActivities = db.activities.some((a) => a.memberId === id);
    if (hasTasks || hasComments || hasKnowledge || hasActivities) {
      return {
        error:
          "担当課題・コメント・Wiki記事・変更履歴があるメンバーは削除できません。先に担当を変更してください。",
      };
    }
    deleteMember(id);
    return { ok: true };
  }

  return { ok: false };
}

export default function Members() {
  const { members, teams, tasks } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">メンバー</h1>
          <p className="page-sub">プロジェクトメンバーの管理</p>
        </div>
      </div>

      {actionData && "error" in actionData && actionData.error && (
        <p className="overdue" style={{ marginBottom: 12 }}>
          {actionData.error}
        </p>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <table className="table">
          <thead>
            <tr>
              <th>メンバー</th>
              <th>所属チーム</th>
              <th>担当課題</th>
              <th>対応中</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const mine = tasks.filter((t) => t.assigneeId === m.id);
              const active = mine.filter(
                (t) => t.status === "open" || t.status === "in_progress",
              ).length;
              const myTeams = teams.filter((t) => t.memberIds.includes(m.id));
              return (
                <tr key={m.id}>
                  <td>
                    <span className="g-assignee" style={{ color: "inherit" }}>
                      <span className="avatar" style={{ background: m.color }}>
                        {m.initial}
                      </span>
                      <strong>{m.name}</strong>
                    </span>
                  </td>
                  <td>
                    <span style={{ display: "inline-flex", gap: 4, flexWrap: "wrap" }}>
                      {myTeams.map((t) => (
                        <span key={t.id} className="chip">
                          {t.name}
                        </span>
                      ))}
                      {myTeams.length === 0 && (
                        <span className="muted">未所属</span>
                      )}
                    </span>
                  </td>
                  <td className="muted">{mine.length} 件</td>
                  <td className="muted">{active} 件</td>
                  <td>
                    <Form
                      method="post"
                      onSubmit={(e) => {
                        if (!confirm(`${m.name} を削除しますか？`)) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="memberId" value={m.id} />
                      <button
                        type="submit"
                        name="intent"
                        value="delete"
                        className="btn small danger"
                      >
                        削除
                      </button>
                    </Form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="card panel" style={{ maxWidth: 560 }}>
        <h2>＋ メンバーを追加</h2>
        <Form method="post" className="form-grid">
          <input type="hidden" name="intent" value="create" />
          <div className="field">
            <label htmlFor="m-name">名前 *</label>
            <input id="m-name" name="name" required />
          </div>
          <div className="field">
            <label htmlFor="m-initial">イニシャル (1文字・省略可)</label>
            <input id="m-initial" name="initial" maxLength={1} placeholder="例: T" />
          </div>
          <div className="field full">
            <label>カラー</label>
            <div className="color-pick">
              {COLORS.map((c, i) => (
                <label key={c} className="color-swatch" style={{ background: c }}>
                  <input
                    type="radio"
                    name="color"
                    value={c}
                    defaultChecked={i === 0}
                  />
                </label>
              ))}
            </div>
          </div>
          <div className="full">
            <button type="submit" className="btn primary">
              追加する
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
