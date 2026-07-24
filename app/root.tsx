import {
  Form,
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  redirect,
  useLoaderData,
  useRouteError,
  type LoaderFunctionArgs,
} from "react-router";
import { getCurrentMember } from "~/lib/session.server";
import "./app.css";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const currentMember = await getCurrentMember(request);
  if (!currentMember && url.pathname !== "/login") {
    throw redirect("/login");
  }
  return { currentMember };
}

const NAV_ITEMS = [
  {
    to: "/",
    label: "ダッシュボード",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="6" height="6" rx="1" />
        <rect x="11" y="3" width="6" height="6" rx="1" />
        <rect x="3" y="11" width="6" height="6" rx="1" />
        <rect x="11" y="11" width="6" height="6" rx="1" />
      </svg>
    ),
  },
  {
    to: "/kanban",
    label: "カンバンボード",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="3" y="3" width="4" height="14" rx="1" />
        <rect x="8" y="3" width="4" height="10" rx="1" />
        <rect x="13" y="3" width="4" height="6" rx="1" />
      </svg>
    ),
  },
  {
    to: "/gantt",
    label: "ガントチャート",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 3v14h14" />
        <rect x="6" y="5" width="8" height="2.6" rx="1.3" />
        <rect x="9" y="9.5" width="7" height="2.6" rx="1.3" />
      </svg>
    ),
  },
  {
    to: "/projects",
    label: "案件一覧",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M3 6a1 1 0 0 1 1-1h4l2 2h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6Z" />
      </svg>
    ),
  },
  {
    to: "/knowledge",
    label: "Wiki",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M10 4.5C8.5 3.5 6.5 3 4 3v13c2.5 0 4.5.5 6 1.5 1.5-1 3.5-1.5 6-1.5V3c-2.5 0-4.5.5-6 1.5Z" />
        <path d="M10 4.5v13" />
      </svg>
    ),
  },
  {
    to: "/issues",
    label: "課題",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M4 5h2M4 10h2M4 15h2" />
        <path d="M9 5h7M9 10h7M9 15h7" />
      </svg>
    ),
  },
  {
    to: "/report",
    label: "週報",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="3" width="12" height="14" rx="1.5" />
        <path d="M7 7h6M7 10h6M7 13h4" />
      </svg>
    ),
  },
  {
    to: "/teams",
    label: "チーム",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="10" cy="6" r="2.6" />
        <path d="M5.5 16c.5-2.8 2.2-4.2 4.5-4.2s4 1.4 4.5 4.2" />
        <circle cx="4.2" cy="8" r="1.8" />
        <circle cx="15.8" cy="8" r="1.8" />
        <path d="M1.8 14.5c.3-1.9 1.3-3 2.9-3.2M18.2 14.5c-.3-1.9-1.3-3-2.9-3.2" />
      </svg>
    ),
  },
  {
    to: "/members",
    label: "メンバー",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="7.5" cy="7" r="3" />
        <path d="M2.5 17c.6-3 2.6-4.5 5-4.5s4.4 1.5 5 4.5" />
        <circle cx="14.5" cy="8" r="2.3" />
        <path d="M13.5 12.6c2.2.2 3.6 1.5 4 4.4" />
      </svg>
    ),
  },
];

export function meta() {
  return [
    { title: "ProjectHub" },
    { name: "description", content: "プロジェクト管理ツール" },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { currentMember } = useLoaderData<typeof loader>();

  // 未ログイン時 (=/login) はサイドバーなしで表示する
  if (!currentMember) {
    return <Outlet />;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">ProjectHub</div>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                "nav-item" + (isActive ? " active" : "")
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <span className="avatar" style={{ background: currentMember.color }}>
            {currentMember.initial}
          </span>
          <span className="sidebar-user-name">{currentMember.name}</span>
          <Form method="post" action="/logout">
            <button type="submit" className="sidebar-logout">
              ログアウト
            </button>
          </Form>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  let message = "エラーが発生しました";
  let detail = "予期しないエラーです。";
  if (isRouteErrorResponse(error)) {
    message = `${error.status} ${error.statusText}`;
    detail = error.status === 404 ? "ページが見つかりません。" : detail;
  } else if (error instanceof Error) {
    detail = error.message;
  }
  return (
    <div className="shell">
      <main className="main">
        <div className="page">
          <h1 className="page-title">{message}</h1>
          <p className="page-sub">{detail}</p>
        </div>
      </main>
    </div>
  );
}
