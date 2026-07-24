import {
  Form,
  Link,
  redirect,
  useLoaderData,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { deleteKnowledge, getDb } from "~/lib/db.server";
import { requireMember } from "~/lib/session.server";
import { formatYMD } from "~/lib/date";

export function meta({ data }: { data?: { article?: { title: string } } }) {
  return [
    { title: `${data?.article?.title ?? "Wiki"} | ProjectHub` },
  ];
}

export async function loader({ params }: LoaderFunctionArgs) {
  const db = getDb();
  const article = db.knowledge.find((k) => k.id === params.id);
  if (!article) {
    throw new Response("Not Found", { status: 404 });
  }
  const author = db.members.find((m) => m.id === article.authorId) ?? null;
  return { article, author };
}

export async function action({ request, params }: ActionFunctionArgs) {
  await requireMember(request);
  if (params.id) deleteKnowledge(params.id);
  return redirect("/knowledge");
}

export default function KnowledgeDetail() {
  const { article, author } = useLoaderData<typeof loader>();

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <p className="page-sub">
            <Link to="/knowledge">← Wiki一覧</Link>
          </p>
          <h1 className="page-title">{article.title}</h1>
          <div className="kn-foot" style={{ marginTop: 6 }}>
            {author && (
              <>
                <span className="avatar" style={{ background: author.color }}>
                  {author.initial}
                </span>
                {author.name}
              </>
            )}
            <span>更新: {formatYMD(article.updatedAt)}</span>
            <span className="kn-tags">
              {article.tags.map((tag) => (
                <span key={tag} className="chip">
                  {tag}
                </span>
              ))}
            </span>
          </div>
        </div>
        <Form
          method="post"
          onSubmit={(e) => {
            if (!confirm("この記事を削除しますか？")) e.preventDefault();
          }}
        >
          <button type="submit" className="btn danger">
            削除
          </button>
        </Form>
      </div>

      <div className="card kn-body">{article.body}</div>
    </div>
  );
}
