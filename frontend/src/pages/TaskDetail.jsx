import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import {
  Card, PageShell, ErrorBox, NoticeBox, StatusBadge, UserChip, Stars,
  inputCls, btnPrimary, btnGhost, btnDanger, money, fmtDate, errMsg,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ price: "", deliveryDays: "", message: "" });

  async function load() {
    try {
      const r = await api.get(`/tasks/${id}`);
      setData(r.data);
      setForm((f) => ({ ...f, price: f.price || r.data.task.budget }));
    } catch (e) {
      setError(errMsg(e, "Failed to load task"));
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function run(fn, after) {
    setBusy(true);
    setError(null);
    try {
      const r = await fn();
      if (after) after(r);
      else await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="max-w-6xl mx-auto px-6 py-10 text-gray-400">{error || "Loading..."}</p>;

  const { task, proposals, myProposal } = data;
  const isOwner = user?.role === "client" && task.client?._id === user._id;
  const canApply = user?.role === "student" && task.status === "open" && !myProposal;

  return (
    <PageShell
      title={task.title}
      subtitle={`${task.category} · budget ${money(task.budget)} · due ${fmtDate(task.deadline)}`}
      actions={<StatusBadge status={task.status} />}
    >
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <p className="text-gray-200 whitespace-pre-line">{task.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {task.skills.map((s) => (
                <span key={s} className="text-xs px-2 py-1 rounded-full border border-[#0f3d34] text-gray-300">{s}</span>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-400">
              Posted by <UserChip user={task.client} />
              {task.college && ` · ${task.college}`}
            </p>
          </Card>

          <ErrorBox>{error}</ErrorBox>

          {isOwner && (
            <div className="space-y-3">
              <h2 className="text-white text-xl font-semibold">Proposals ({proposals?.length || 0})</h2>
              {task.status === "open" && (
                <NoticeBox>
                  Accepting a proposal moves the amount from your wallet into escrow. The freelancer is paid only after you approve the work.
                </NoticeBox>
              )}
              {proposals?.length === 0 && <p className="text-gray-400">No proposals yet.</p>}
              {proposals?.map((p) => (
                <Card key={p._id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <UserChip user={p.student} />
                      <div className="mt-1"><Stars avg={p.student?.stats?.ratingAvg} count={p.student?.stats?.ratingCount} /></div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{money(p.price)}</p>
                      <p className="text-xs text-gray-400">{p.deliveryDays} days</p>
                      <StatusBadge status={p.status} />
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mt-3 whitespace-pre-line">{p.message}</p>
                  {p.status === "pending" && task.status === "open" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={busy}
                        className={btnPrimary}
                        onClick={() => run(() => api.post(`/proposals/${p._id}/accept`), (r) => navigate(`/orders/${r.data.order._id}`))}
                      >
                        Hire & fund escrow ({money(p.price)})
                      </button>
                      <button disabled={busy} className={btnGhost} onClick={() => run(() => api.post(`/proposals/${p._id}/reject`))}>
                        Reject
                      </button>
                    </div>
                  )}
                </Card>
              ))}
              {task.status === "open" && (
                <button disabled={busy} className={btnDanger} onClick={() => confirm("Cancel this task?") && run(() => api.post(`/tasks/${task._id}/cancel`))}>
                  Cancel task
                </button>
              )}
              {task.order && (
                <Link to={`/orders/${task.order}`} className="text-[#18c29c] underline text-sm">
                  Go to the order
                </Link>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          {user?.role === "student" && myProposal && (
            <Card>
              <h3 className="text-white font-semibold mb-2">Your proposal</h3>
              <p className="text-white">{money(myProposal.price)} · {myProposal.deliveryDays} days</p>
              <p className="text-gray-300 text-sm mt-2">{myProposal.message}</p>
              <div className="mt-2"><StatusBadge status={myProposal.status} /></div>
              {myProposal.status === "pending" && (
                <button disabled={busy} className={`${btnGhost} mt-3`} onClick={() => run(() => api.post(`/proposals/${myProposal._id}/withdraw`))}>
                  Withdraw
                </button>
              )}
            </Card>
          )}

          {canApply && (
            <Card>
              <h3 className="text-white font-semibold mb-3">Send a proposal</h3>
              <form
                className="space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(() => api.post(`/tasks/${task._id}/proposals`, {
                    price: Number(form.price),
                    deliveryDays: Number(form.deliveryDays),
                    message: form.message,
                  }));
                }}
              >
                <label className="block">
                  <span className="text-xs text-gray-400">Your price (₹)</span>
                  <input required type="number" min={50} className={inputCls} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Delivery in (days)</span>
                  <input required type="number" min={1} className={inputCls} value={form.deliveryDays} onChange={(e) => setForm({ ...form, deliveryDays: e.target.value })} />
                </label>
                <label className="block">
                  <span className="text-xs text-gray-400">Why you? (no links or contact info)</span>
                  <textarea required minLength={10} rows={4} className={inputCls} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
                </label>
                <button disabled={busy} className={`${btnPrimary} w-full`}>Send proposal</button>
              </form>
            </Card>
          )}

          {!user && (
            <Card>
              <p className="text-gray-300 text-sm">
                <Link to="/login" className="text-[#18c29c] underline">Sign in</Link> as a student to send a proposal.
              </p>
            </Card>
          )}
          {user?.role === "student" && task.status !== "open" && !myProposal && (
            <Card><p className="text-gray-400 text-sm">This task is no longer open.</p></Card>
          )}
        </aside>
      </div>
    </PageShell>
  );
}
