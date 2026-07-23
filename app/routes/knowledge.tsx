import {
  Form,
  Link,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { createKnowledge, getDb } from "~/lib/db.server";
import { getCurrentMember } from "~/lib/session.server";
import { formatYMD, toISODate, today } from "~/lib/date";

export function meta() {
  return [{ title: "Wiki | ProjectHub" }];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const db = getDb();
  let articles = db.knowledge;
  if (q) {
    const needle = q.toLowerCase();
    articles = articles.filter(
      (k) =>
        k.title.toLowerCase().includes(needle) ||
        k.body.toLowerCase().includes(needle) ||
        k.tags.some((tag) => tag.toLowerCase().includes(needle)),
    );
  }
  articles = [...articles].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  return { articles, members: db.members, q };
}

export async function action({ request }: ActionFunctionArgs) {
  const me = await getCurrentMember(request);
  if (!me) throw redirect("/login");
  const form = await request.formData();
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const tags = String(form.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!title || !body) {
    return { error: "タイトルと本文は必須です。" };
  }
  const article = createKnowledge({
    title,
    body,
    tags,
    authorId: me.id,
    updatedAt: toISODate(today()),
  });
  return redirect(`/knowledge/${article.id}`);
}

export default function Knowledge() {
  const { articles, members, q } = useLoaderData<typeof loader>();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Wiki</h1>
          <p className="page-sub">チームの手順書・ルール・ノウハウ共有</p>
        </div>
      </div>

      <Form method="get" className="toolbar">
        <input name="q" placeholder="キーワード・タグで検索" defaultValue={q} />
        <button type="submit" className="btn">
          検索
        </button>
      </Form>

      <div className="knowledge-grid" style={{ marginBottom: 14 }}>
        {articles.map((k) => {
          const author = members.find((m) => m.id === k.authorId);
          return (
            <div className="card kn-card" key={k.id}>
              <h3>
                <Link to={`/knowledge/${k.id}`}>{k.title}</Link>
              </h3>
              <div className="excerpt">{k.body}</div>
              <div className="kn-tags">
                {k.tags.map((tag) => (
                  <span key={tag} className="chip">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="kn-foot">
                {author && (
                  <>
                    <span
                      className="avatar"
                      style={{ background: author.color }}
                    >
                      {author.initial}
                    </span>
                    {author.name}
                  </>
                )}
                <span>更新: {formatYMD(k.updatedAt)}</span>
              </div>
            </div>
          );
        })}
        {articles.length === 0 && (
          <p className="muted">該当する記事がありません。</p>
        )}
      </div>

      <details className="card collapse">
        <summary className="panel" style={{ fontWeight: 700 }}>
          ＋ 記事を書く
        </summary>
        <div style={{ padding: "0 18px 18px" }}>
          <Form method="post" className="form-grid">
            <div className="field full">
              <label htmlFor="k-title">タイトル *</label>
              <input id="k-title" name="title" required />
            </div>
            <div className="field full">
              <label htmlFor="k-tags">タグ (カンマ区切り)</label>
              <input id="k-tags" name="tags" placeholder="運用, ルール" />
            </div>
            <div className="field full">
              <label htmlFor="k-body">本文 *</label>
              <textarea id="k-body" name="body" rows={6} required />
            </div>
            <div className="full">
              <button type="submit" className="btn primary">
                公開する
              </button>
            </div>
          </Form>
        </div>
      </details>
    </div>
  );
}
