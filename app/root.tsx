import {
  Links,
  Meta,
  NavLink,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import "./app.css";

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
