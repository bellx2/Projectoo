import {
  Form,
  useActionData,
  useLoaderData,
  type ActionFunctionArgs,
} from "react-router";
import {
  createTeam,
  deleteTeam,
  getDb,
  updateTeam,
} from "~/lib/db.server";
import type { Member } from "~/lib/types";

export function meta() {
  return [{ title: "チーム | ProjectHub" }];
}

export async function loader() {
  const db = getDb();
  return { teams: db.teams, members: db.members };
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const intent = form.get("intent");
  const memberIds = form.getAll("memberIds").map(String);

  if (intent === "create") {
    const name = String(form.get("name") ?? "").trim();
    if (!name) return { error: "チーム名を入力してください。" };
    createTeam({ name, memberIds });
    return { ok: true };
  }

  if (intent === "update") {
    const id = String(form.get("teamId") ?? "");
    const name = String(form.get("name") ?? "").trim();
    if (!name) return { error: "チーム名を入力してください。" };
    updateTeam(id, { name, memberIds });
    return { ok: true };
  }

  if (intent === "delete") {
    deleteTeam(String(form.get("teamId") ?? ""));
    return { ok: true };
  }

  return { ok: false };
}

function MemberChecks({
  members,
  checked,
  idPrefix,
}: {
  members: Member[];
  checked?: Set<string>;
  idPrefix: string;
}) {
  return (
    <div className="member-checks">
      {members.map((m) => (
        <label key={m.id} className="member-check" htmlFor={`${idPrefix}-${m.id}`}>
          <input
            id={`${idPrefix}-${m.id}`}
            type="checkbox"
            name="memberIds"
            value={m.id}
            defaultChecked={checked?.has(m.id) ?? false}
          />
          <span className="avatar" style={{ background: m.color }}>
            {m.initial}
          </span>
          {m.name}
        </label>
      ))}
    </div>
  );
}

export default function Teams() {
  const { teams, members } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">チーム</h1>
          <p className="page-sub">
            メンバーは複数のチームに所属できます。週報や課題の絞り込みに使えます
          </p>
        </div>
      </div>

      {actionData && "error" in actionData && actionData.error && (
        <p className="overdue" style={{ marginBottom: 12 }}>
          {actionData.error}
        </p>
      )}

      <div className="knowledge-grid" style={{ marginBottom: 14 }}>
        {teams.map((team) => (
          <div className="card panel" key={team.id}>
            <Form method="post">
              <input type="hidden" name="teamId" value={team.id} />
              <div className="field" style={{ marginBottom: 10 }}>
                <label htmlFor={`name-${team.id}`}>チーム名</label>
                <input
                  id={`name-${team.id}`}
                  name="name"
                  defaultValue={team.name}
                  required
                />
              </div>
              <div className="field" style={{ marginBottom: 12 }}>
                <label>メンバー ({team.memberIds.length}人)</label>
                <MemberChecks
                  members={members}
                  checked={new Set(team.memberIds)}
                  idPrefix={team.id}
                />
              </div>
              <div className="form-actions" style={{ marginTop: 0 }}>
                <button
                  type="submit"
                  name="intent"
                  value="update"
                  className="btn primary"
                >
                  保存する
                </button>
                <button
                  type="submit"
                  name="intent"
                  value="delete"
                  className="btn danger"
                  formNoValidate
                  onClick={(e) => {
                    if (!confirm(`チーム「${team.name}」を削除しますか？`)) {
                      e.preventDefault();
                    }
                  }}
                >
                  削除
                </button>
              </div>
            </Form>
          </div>
        ))}
        {teams.length === 0 && (
          <p className="muted">まだチームがありません。下のフォームから作成してください。</p>
        )}
      </div>

      <div className="card panel" style={{ maxWidth: 560 }}>
        <h2>＋ チームを作成</h2>
        <Form method="post">
          <input type="hidden" name="intent" value="create" />
          <div className="field" style={{ marginBottom: 10 }}>
            <label htmlFor="new-team-name">チーム名 *</label>
            <input id="new-team-name" name="name" required placeholder="例: 開発チーム" />
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <label>メンバー</label>
            <MemberChecks members={members} idPrefix="new-team" />
          </div>
          <button type="submit" className="btn primary">
            作成する
          </button>
        </Form>
      </div>
    </div>
  );
}
