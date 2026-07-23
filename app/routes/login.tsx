import {
  Form,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { getDb } from "~/lib/db.server";
import { getCurrentMember, loginHeaders } from "~/lib/session.server";

export function meta() {
  return [{ title: "ログイン | ProjectHub" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const member = await getCurrentMember(request);
  if (member) throw redirect("/");
  return { members: getDb().members };
}

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const memberId = String(form.get("memberId") ?? "");
  const member = getDb().members.find((m) => m.id === memberId);
  if (!member) {
    return { error: "メンバーが見つかりません。" };
  }
  return redirect("/", { headers: await loginHeaders(member.id) });
}

export default function Login() {
  const { members } = useLoaderData<typeof loader>();

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-brand">ProjectHub</div>
        <p className="page-sub" style={{ marginBottom: 18 }}>
          自分のアカウントを選んでログインしてください
        </p>
        <Form method="post" className="login-list">
          {members.map((m) => (
            <button
              key={m.id}
              type="submit"
              name="memberId"
              value={m.id}
              className="login-member"
            >
              <span className="avatar lg" style={{ background: m.color }}>
                {m.initial}
              </span>
              <span className="name">{m.name}</span>
              <span className="muted">ログイン →</span>
            </button>
          ))}
        </Form>
        <p className="muted" style={{ marginTop: 16, fontSize: 12 }}>
          メンバーの追加はログイン後の「メンバー」画面から行えます。
        </p>
      </div>
    </div>
  );
}
