import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Card, PageShell, ErrorBox, StatusBadge, money, fmtDate, errMsg } from "../components/ui";
import { useAuth } from "../context/AuthContext";

// Clients: tasks they posted. Students: proposals they sent.
export default function MyWork() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(isClient ? "/tasks/mine/list" : "/proposals/mine")
      .then((r) => setItems(isClient ? r.data.tasks : r.data.proposals))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [isClient]);

  return (
    <PageShell
      title={isClient ? "My tasks" : "My proposals"}
      actions={isClient && <Link to="/tasks/new" className="px-4 py-2 rounded-xl bg-[#18c29c] text-black font-semibold text-sm">Post a task</Link>}
      narrow
    >
      <ErrorBox>{error}</ErrorBox>
      {loading && <p className="text-gray-400">Loading...</p>}
      {!loading && items.length === 0 && (
        <p className="text-gray-400">
          {isClient ? "You haven't posted any tasks yet." : "You haven't sent any proposals yet."}{" "}
          {!isClient && <Link to="/tasks" className="text-[#18c29c] underline">Browse tasks</Link>}
        </p>
      )}
      <div className="space-y-3">
        {items.map((it) => {
          const task = isClient ? it : it.task;
          return (
            <Link key={it._id} to={`/tasks/${task?._id}`}>
              <Card className="hover:border-[#18c29c] transition flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-white font-semibold">{task?.title}</p>
                  <p className="text-xs text-gray-400">
                    {isClient ? `${it.proposalCount} proposals · budget ${money(it.budget)}` : `Your offer ${money(it.price)} · ${it.deliveryDays} days`}
                    {task?.deadline && ` · due ${fmtDate(task.deadline)}`}
                  </p>
                </div>
                <StatusBadge status={it.status} />
              </Card>
            </Link>
          );
        })}
      </div>
    </PageShell>
  );
}
