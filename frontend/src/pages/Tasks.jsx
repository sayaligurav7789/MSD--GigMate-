import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { CATEGORIES } from "../lib/constants";
import { Card, PageShell, ErrorBox, StatusBadge, UserChip, inputCls, money, fmtDate, errMsg } from "../components/ui";
import { useAuth } from "../context/AuthContext";

// Browse open tasks. Students can filter to their own college (campus feed).
export default function Tasks() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const college = params.get("college") || "";
  const myCollege = user?.studentProfile?.college || "";

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get("/tasks", { params: { q, category, college } })
      .then((r) => setTasks(r.data.tasks))
      .catch((e) => setError(errMsg(e, "Failed to load tasks")))
      .finally(() => setLoading(false));
  }, [q, category, college]);

  function update(key, val) {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next);
  }

  return (
    <PageShell
      title="Tasks"
      subtitle="Small, beginner-friendly jobs posted by students, clubs and local businesses"
      actions={
        user?.role === "client" && (
          <Link to="/tasks/new" className="px-4 py-2 rounded-xl bg-[#18c29c] text-black font-semibold text-sm">
            Post a task
          </Link>
        )
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
        <input className={inputCls} placeholder="Search tasks" value={q} onChange={(e) => update("q", e.target.value)} />
        <select className={inputCls} value={category} onChange={(e) => update("category", e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input className={inputCls} placeholder="College" value={college} onChange={(e) => update("college", e.target.value)} />
        {myCollege && (
          <button
            type="button"
            onClick={() => update("college", college ? "" : myCollege)}
            className="px-3 py-2 rounded-md border border-[#0f3d34] text-gray-200 hover:bg-[#0f3d34] text-sm"
          >
            {college ? "Show all colleges" : `Only ${myCollege}`}
          </button>
        )}
      </div>

      <ErrorBox>{error}</ErrorBox>
      {loading && <p className="text-gray-400">Loading...</p>}
      {!loading && !error && tasks.length === 0 && <p className="text-gray-400">No open tasks match your filters.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tasks.map((t) => (
          <Link key={t._id} to={`/tasks/${t._id}`}>
            <Card className="hover:border-[#18c29c] transition h-full flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#18c29c] uppercase tracking-wide">{t.category}</span>
                <StatusBadge status={t.status} />
              </div>
              <h3 className="text-white font-semibold mt-1">{t.title}</h3>
              <p className="text-gray-400 text-sm mt-2 line-clamp-3 flex-1">{t.description}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {t.skills.slice(0, 4).map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full border border-[#0f3d34] text-gray-300">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-[#0f3d34] flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  {t.college || "Open to all"} · due {fmtDate(t.deadline)} · {t.proposalCount} proposals
                </span>
                <span className="text-white font-semibold">{money(t.budget)}</span>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                <UserChip user={t.client} />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
