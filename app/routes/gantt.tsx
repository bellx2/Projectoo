import { useState } from "react";
import { Form, Link, useLoaderData, useSearchParams } from "react-router";
import { getDb } from "~/lib/db.server";
import {
  addDays,
  diffDays,
  isWeekend,
  parseISODate,
  toISODate,
  today,
} from "~/lib/date";
import { STATUS_LABEL, STATUS_ORDER } from "~/lib/status";
import type { Member, Task } from "~/lib/types";

const DAY_W = 30;

export function meta() {
  return [{ title: "ガントチャート | ProjectHub" }];
}

export async function loader() {
  const db = getDb();
  const base = today();
  const rangeStart = toISODate(addDays(base, -9));
  return {
    members: db.members,
    tasks: db.tasks,
    projects: db.projects,
    rangeStart,
    numDays: 36,
    todayStr: toISODate(base),
  };
}

interface Row {
  task: Task;
  depth: number;
  hasChildren: boolean;
}

function buildRows(tasks: Task[], memberId: string, collapsed: Set<string>): Row[] {
  const mine = tasks.filter((t) => t.assigneeId === memberId);
  const byStart = (a: Task, b: Task) =>
    a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id);
  const roots = mine.filter((t) => t.parentId === null).sort(byStart);
  const rows: Row[] = [];
  for (const root of roots) {
    const children = mine.filter((t) => t.parentId === root.id).sort(byStart);
    rows.push({ task: root, depth: 0, hasChildren: children.length > 0 });
    if (!collapsed.has(root.id)) {
      for (const child of children) {
        rows.push({ task: child, depth: 1, hasChildren: false });
      }
    }
  }
  return rows;
}

export default function Gantt() {
  const { members, tasks, rangeStart, numDays, todayStr } =
    useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const hideDone = searchParams.get("done") === "0";
  const shadeWeekend = searchParams.get("wk") !== "0";
  const editMode = searchParams.get("edit") === "1";

  const visibleTasks = hideDone
    ? tasks.filter((t) => t.status !== "done")
    : tasks;

  const start = parseISODate(rangeStart);
  const days = Array.from({ length: numDays }, (_, i) => addDays(start, i));

  const monthSegments: { label: string; count: number }[] = [];
  for (const d of days) {
    const label = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}`;
    const last = monthSegments[monthSegments.length - 1];
    if (last && last.label === label) last.count += 1;
    else monthSegments.push({ label, count: 1 });
  }

  const toggle = (id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const editToggleParams = new URLSearchParams(searchParams);
  if (editMode) editToggleParams.delete("edit");
  else editToggleParams.set("edit", "1");

  const memberOf = (id: string) => members.find((m) => m.id === id);

  const dayCells = (rowKey: string) =>
    days.map((d, i) => {
      const iso = toISODate(d);
      const cls =
        "g-day" +
        (shadeWeekend && isWeekend(d) ? " weekend" : "") +
        (iso === todayStr ? " today" : "");
      return <div key={`${rowKey}-${i}`} className={cls} />;
    });

  const barFor = (task: Task) => {
    const s = diffDays(start, parseISODate(task.startDate));
    const e = diffDays(start, parseISODate(task.endDate));
    const from = Math.max(0, s);
    const to = Math.min(numDays - 1, e);
    if (to < 0 || from > numDays - 1 || to < from) return null;
    return (
      <div
        className={`g-bar st-${task.status}`}
        style={{ left: from * DAY_W, width: (to - from + 1) * DAY_W - 5 }}
        title={`${task.title} (${task.startDate}〜${task.endDate})`}
      >
        <span>{task.title}</span>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">ガントチャート</h1>
          <p className="page-sub">全案件横断のタスクスケジュール</p>
        </div>
      </div>

      <div className="card gantt-card">
        <div className="gantt-toolbar">
          <div className="legend">
            {STATUS_ORDER.map((s) => (
              <span key={s} className="legend-item">
                <span
                  className="legend-dot"
                  style={{ background: `var(--status-${s.replace("_", "-")})` }}
                />
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
          <details className="settings-pop">
            <summary className="btn">⚙ 表示設定</summary>
            <Form method="get" className="settings-menu">
              {editMode && <input type="hidden" name="edit" value="1" />}
              <label>
                <input
                  type="checkbox"
                  name="done"
                  value="0"
                  defaultChecked={hideDone}
                />
                完了タスクを隠す
              </label>
              <label>
                <input
                  type="checkbox"
                  name="wk"
                  value="0"
                  defaultChecked={!shadeWeekend}
                />
                週末の強調をオフ
              </label>
              <button type="submit" className="btn small primary">
                適用
              </button>
            </Form>
          </details>
          <Link className="btn" to={`?${editToggleParams}`}>
            ✎ {editMode ? "編集を終了" : "編集する"}
          </Link>
          {editMode && (
            <Link className="btn primary" to="/tasks/new">
              ＋ タスク追加
            </Link>
          )}
          <a className="btn" href="/gantt/export">
            ⬇ Excel出力
          </a>
        </div>

        <div className="gantt-scroll">
          <div className="gantt-grid">
            {/* month header */}
            <div className="g-row g-head" style={{ height: 26 }}>
              <div className="g-left c1" />
              <div className="g-left c2" />
              <div className="g-month-row">
                {monthSegments.map((seg) => (
                  <div
                    key={seg.label}
                    className="g-month-cell"
                    style={{ width: seg.count * DAY_W }}
                  >
                    {seg.label}
                  </div>
                ))}
              </div>
            </div>
            {/* day header */}
            <div className="g-row g-head" style={{ height: 34 }}>
              <div className="g-left c1">件名</div>
              <div className="g-left c2">担当者</div>
              <div className="g-timeline">
                {days.map((d, i) => {
                  const iso = toISODate(d);
                  const cls =
                    "g-day-head" +
                    (shadeWeekend && isWeekend(d) ? " weekend" : "") +
                    (iso === todayStr ? " today" : "");
                  return (
                    <div key={i} className={cls}>
                      <span className="num">{d.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {members.map((member) => {
              const rows = buildRows(visibleTasks, member.id, collapsed);
              const groupClosed = collapsed.has(`g-${member.id}`);
              return (
                <MemberGroup
                  key={member.id}
                  member={member}
                  rows={rows}
                  closed={groupClosed}
                  onToggle={() => toggle(`g-${member.id}`)}
                  onToggleTask={toggle}
                  collapsed={collapsed}
                  dayCells={dayCells}
                  barFor={barFor}
                  editMode={editMode}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MemberGroup({
  member,
  rows,
  closed,
  onToggle,
  onToggleTask,
  collapsed,
  dayCells,
  barFor,
  editMode,
}: {
  member: Member;
  rows: Row[];
  closed: boolean;
  onToggle: () => void;
  onToggleTask: (id: string) => void;
  collapsed: Set<string>;
  dayCells: (rowKey: string) => React.ReactNode;
  barFor: (task: Task) => React.ReactNode;
  editMode: boolean;
}) {
  const rootCount = rows.filter((r) => r.depth === 0).length;
  return (
    <>
      <div className="g-row group">
        <div className="g-left c1">
          <button type="button" className="g-group-toggle" onClick={onToggle}>
            <span className={"g-caret" + (closed ? " closed" : "")}>▼</span>
            <span className="avatar" style={{ background: member.color }}>
              {member.initial}
            </span>
            {member.name}
            <span className="g-count">{rootCount}</span>
          </button>
        </div>
        <div className="g-left c2" />
        <div className="g-timeline">{dayCells(`g-${member.id}`)}</div>
      </div>
      {!closed &&
        rows.map(({ task, depth, hasChildren }) => (
          <div className="g-row" key={task.id}>
            <div className="g-left c1">
              <div className={"g-task-name" + (depth > 0 ? " child" : "")}>
                {hasChildren ? (
                  <button
                    type="button"
                    className="g-group-toggle"
                    onClick={() => onToggleTask(task.id)}
                    aria-label="子タスクの表示切替"
                  >
                    <span
                      className={
                        "g-caret" + (collapsed.has(task.id) ? " closed" : "")
                      }
                    >
                      ▼
                    </span>
                  </button>
                ) : null}
                <Link to={`/issues/${task.id}`}>{task.title}</Link>
                {editMode && (
                  <Link
                    to={`/tasks/${task.id}/edit`}
                    title="編集"
                    style={{ flexShrink: 0 }}
                  >
                    ✎
                  </Link>
                )}
              </div>
            </div>
            <div className="g-left c2">
              <span className="g-assignee">
                <span className="avatar" style={{ background: member.color }}>
                  {member.initial}
                </span>
                {member.name}
              </span>
            </div>
            <div className="g-timeline">
              {dayCells(task.id)}
              {barFor(task)}
            </div>
          </div>
        ))}
    </>
  );
}
