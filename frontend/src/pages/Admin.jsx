import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, PageShell, ErrorBox, StatusBadge, TrustBadge, inputCls, btnPrimary, btnGhost, btnDanger, money, fmtDateTime, errMsg } from "../components/ui";

const TABS = [
  ["overview", "Overview"],
  ["verifications", "Verifications"],
  ["disputes", "Disputes & reports"],
  ["flagged", "Flagged chats"],
  ["users", "Users"],
];

export default function Admin() {
  const [tab, setTab] = useState("overview");
  return (
    <PageShell title="Admin panel" subtitle="Verification, disputes and fraud monitoring">
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-md text-sm border ${tab === k ? "bg-[#18c29c] text-black border-[#18c29c] font-semibold" : "border-[#0f3d34] text-gray-200 hover:bg-[#0f3d34]"}`}
          >
            {l}
          </button>
        ))}
      </div>
      {tab === "overview" && <Overview />}
      {tab === "verifications" && <Verifications />}
      {tab === "disputes" && <Reports />}
      {tab === "flagged" && <Flagged />}
      {tab === "users" && <Users />}
    </PageShell>
  );
}

// Loads a list from the API and exposes reload + error state.
function useList(url, key) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try {
      const r = await api.get(url);
      setItems(r.data[key]);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [url, key]);
  useEffect(() => {
    reload();
  }, [reload]);
  return { items, error, loading, reload, setError };
}

function Overview() {
  const [s, setS] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    api.get("/admin/stats").then((r) => setS(r.data)).catch((e) => setError(errMsg(e)));
  }, []);
  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!s) return <p className="text-gray-400">Loading...</p>;
  const cards = [
    ["Users", s.users],
    ["Pending verifications", s.pendingVerifications],
    ["Open disputes/reports", s.openReports],
    ["Flagged messages", s.flaggedMessages],
    ["Open tasks", s.openTasks],
    ["Active orders", s.activeOrders],
    ["Held in escrow", money(s.escrowHeld)],
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(([l, v]) => (
        <Card key={l}>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{l}</p>
          <p className="text-white text-2xl font-semibold mt-1">{v}</p>
        </Card>
      ))}
    </div>
  );
}

function Verifications() {
  const { items, error, loading, reload, setError } = useList("/admin/users?status=pending", "users");
  const [reasons, setReasons] = useState({});

  async function decide(id, approve) {
    try {
      await api.post(`/admin/users/${id}/verification`, { approve, reason: reasons[id] });
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <div className="space-y-3">
      <ErrorBox>{error}</ErrorBox>
      {loading && <p className="text-gray-400">Loading...</p>}
      {!loading && items.length === 0 && <p className="text-gray-400">No pending verifications.</p>}
      {items.map((u) => (
        <Card key={u._id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-white font-semibold">{u.name} <span className="text-xs text-gray-400 capitalize">({u.role})</span></p>
              <p className="text-sm text-gray-400">Login: {u.email}</p>
              <p className="text-sm text-gray-400">Verified email: {u.verification?.collegeEmail}</p>
              {u.studentProfile?.college && <p className="text-sm text-gray-400">College: {u.studentProfile.college}</p>}
              {u.clientProfile?.companyName && <p className="text-sm text-gray-400">Company: {u.clientProfile.companyName}</p>}
              <p className="text-sm mt-1">
                <a className="text-[#18c29c] underline break-all" href={u.verification?.idProofUrl} target="_blank" rel="noopener noreferrer nofollow">
                  View ID proof
                </a>
              </p>
              {u.verification?.idNote && <p className="text-sm text-gray-300 mt-1">Note: {u.verification.idNote}</p>}
            </div>
            <div className="space-y-2 w-full sm:w-64">
              <input className={inputCls} placeholder="Rejection reason (optional)" value={reasons[u._id] || ""} onChange={(e) => setReasons({ ...reasons, [u._id]: e.target.value })} />
              <div className="flex gap-2">
                <button className={btnPrimary} onClick={() => decide(u._id, true)}>Approve</button>
                <button className={btnDanger} onClick={() => decide(u._id, false)}>Reject</button>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Reports() {
  const [status, setStatus] = useState("open");
  const { items, error, loading, reload, setError } = useList(`/admin/reports?status=${status}`, "reports");
  const [notes, setNotes] = useState({});

  async function resolve(id, decision) {
    try {
      await api.post(`/admin/reports/${id}/resolve`, { decision, note: notes[id] || "" });
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {["open", "resolved", "all"].map((s) => (
          <button key={s} onClick={() => setStatus(s)} className={`${btnGhost} ${status === s ? "bg-[#0f3d34]" : ""}`}>{s}</button>
        ))}
      </div>
      <ErrorBox>{error}</ErrorBox>
      {loading && <p className="text-gray-400">Loading...</p>}
      {!loading && items.length === 0 && <p className="text-gray-400">Nothing here.</p>}
      {items.map((r) => (
        <Card key={r._id}>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={r.type === "dispute" ? "disputed" : "pending"} />
            <span className="text-white font-semibold capitalize">{r.type}: {r.reason}</span>
            <StatusBadge status={r.status === "open" ? "open" : "completed"} />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Reported by <b className="text-gray-200">{r.reporter?.name}</b> ({r.reporter?.role}) against{" "}
            <b className="text-gray-200">{r.target?.name}</b> ({r.target?.role}) <TrustBadge user={r.target} /> · {fmtDateTime(r.createdAt)}
          </p>
          {r.order && <p className="text-sm text-gray-400">Order: {r.order.title} · {money(r.order.escrow?.amount)} escrow {r.order.escrow?.status} · {r.order.status}</p>}
          {r.details && <p className="text-gray-300 text-sm mt-2 whitespace-pre-line">{r.details}</p>}
          {r.status === "open" ? (
            <div className="mt-3 space-y-2">
              <input className={inputCls} placeholder="Decision note (optional)" value={notes[r._id] || ""} onChange={(e) => setNotes({ ...notes, [r._id]: e.target.value })} />
              <div className="flex flex-wrap gap-2">
                {r.type === "dispute" ? (
                  <>
                    <button className={btnPrimary} onClick={() => resolve(r._id, "release")}>Release to freelancer</button>
                    <button className={btnGhost} onClick={() => resolve(r._id, "refund")}>Refund client</button>
                  </>
                ) : (
                  <>
                    <button className={btnGhost} onClick={() => resolve(r._id, "dismiss")}>Dismiss</button>
                    <button className={btnGhost} onClick={() => resolve(r._id, "warn")}>Warn (counts against trust)</button>
                    <button className={btnDanger} onClick={() => resolve(r._id, "ban")}>Ban user</button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-emerald-300">Resolved: {r.resolution?.decision}{r.resolution?.note && ` - ${r.resolution.note}`}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

function Flagged() {
  const { items, error, loading } = useList("/admin/flagged-messages", "messages");
  return (
    <div className="space-y-3">
      <ErrorBox>{error}</ErrorBox>
      {loading && <p className="text-gray-400">Loading...</p>}
      {!loading && items.length === 0 && <p className="text-gray-400">No flagged messages.</p>}
      {items.map((m) => (
        <Card key={m._id}>
          <p className="text-sm text-gray-400">
            <b className="text-gray-200">{m.sender?.name}</b> ({m.sender?.role}) · strikes {m.sender?.stats?.fraudStrikes} · {fmtDateTime(m.createdAt)}
          </p>
          <p className="text-sm mt-2"><span className="text-gray-500">Original:</span> <span className="text-red-200 break-words">{m.originalText}</span></p>
          <p className="text-sm"><span className="text-gray-500">Shown to other user:</span> <span className="text-gray-300">{m.text}</span></p>
          <p className="text-xs text-yellow-300 mt-1">{m.flagReasons.join(", ")}</p>
        </Card>
      ))}
    </div>
  );
}

function Users() {
  const [q, setQ] = useState("");
  const { items, error, loading, reload, setError } = useList(`/admin/users?q=${encodeURIComponent(q)}`, "users");

  async function ban(id, banned) {
    try {
      await api.post(`/admin/users/${id}/ban`, { banned });
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  }

  return (
    <div className="space-y-3">
      <input className={inputCls} placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      <ErrorBox>{error}</ErrorBox>
      {loading && <p className="text-gray-400">Loading...</p>}
      <div className="rounded-xl border border-[#0f3d34] overflow-hidden">
        {items.map((u) => (
          <div key={u._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[#0f3d34] last:border-b-0 bg-[#062a23]">
            <div>
              <p className="text-white text-sm">{u.name} <span className="text-xs text-gray-400 capitalize">({u.role})</span></p>
              <p className="text-xs text-gray-400">{u.email} · fraud strikes {u.stats?.fraudStrikes ?? 0} · reports {u.stats?.reportCount ?? 0}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={u.verification?.status || "none"} />
              <TrustBadge user={u} />
              {u.isBanned ? (
                <button className={btnGhost} onClick={() => ban(u._id, false)}>Unban</button>
              ) : (
                <button className={btnDanger} onClick={() => ban(u._id, true)}>Ban</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
