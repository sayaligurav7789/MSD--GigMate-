import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import {
  Card, PageShell, ErrorBox, NoticeBox, StatusBadge, UserChip,
  inputCls, btnPrimary, btnGhost, btnDanger, money, fmtDate, fmtDateTime, errMsg,
} from "../components/ui";
import { useAuth } from "../context/AuthContext";

const REPORT_REASONS = [
  ["fake-client", "Fake client"],
  ["phishing-link", "Sent a phishing link"],
  ["asked-for-bank-details", "Asked for bank details"],
  ["off-platform-payment", "Asked to pay outside GigMate"],
  ["harassment", "Harassment"],
  ["plagiarism", "Plagiarised work"],
  ["other", "Other"],
];

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.get(`/orders/${id}`);
      setData(r.data);
    } catch (e) {
      setError(errMsg(e, "Failed to load order"));
    }
  }, [id]);

  const loadMessages = useCallback(async () => {
    try {
      const r = await api.get(`/orders/${id}/messages`);
      setMessages(r.data.messages);
    } catch {
      /* chat is best-effort */
    }
  }, [id]);

  useEffect(() => {
    load();
    loadMessages();
    const t = setInterval(loadMessages, 5000); // simple polling chat
    return () => clearInterval(t);
  }, [load, loadMessages]);

  async function act(fn, okMsg) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
      if (okMsg) setNotice(okMsg);
      await load();
      await loadMessages();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (!data) return <p className="max-w-6xl mx-auto px-6 py-10 text-gray-400">{error || "Loading..."}</p>;
  const { order, reviews, autoReleaseDays } = data;
  const isClient = order.client?._id === user._id;
  const isStudent = order.student?._id === user._id;
  const other = isClient ? order.student : order.client;
  const myReview = reviews.find((r) => r.reviewer === user._id);
  const active = ["in-progress", "delivered"].includes(order.status);

  return (
    <PageShell
      title={order.title || "Order"}
      subtitle={`${money(order.price)}${order.deadline ? ` · due ${fmtDate(order.deadline)}` : ""}`}
      actions={<StatusBadge status={order.status} />}
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <ErrorBox>{error}</ErrorBox>
          <NoticeBox>{notice}</NoticeBox>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">{isClient ? "Freelancer" : "Client"}</p>
                <UserChip user={other} />
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Escrow</p>
                <p className="text-white">
                  {money(order.escrow.amount)} <StatusBadge status={order.escrow.status} />
                </p>
              </div>
            </div>
            {order.requirements && (
              <p className="mt-4 text-gray-300 text-sm whitespace-pre-line">
                <span className="text-gray-400">Requirements: </span>
                {order.requirements}
              </p>
            )}
            {order.task && (
              <Link to={`/tasks/${order.task._id}`} className="mt-3 inline-block text-[#18c29c] underline text-sm">
                View original task
              </Link>
            )}
          </Card>

          {order.delivery?.deliveredAt && (
            <Card>
              <h3 className="text-white font-semibold">Delivery</h3>
              <p className="text-xs text-gray-400">Delivered {fmtDateTime(order.delivery.deliveredAt)}</p>
              <p className="text-gray-200 mt-2 whitespace-pre-line">{order.delivery.note}</p>
              {order.delivery.link && (
                <p className="mt-2 text-sm">
                  <a href={order.delivery.link} target="_blank" rel="noopener noreferrer nofollow" className="text-[#18c29c] underline break-all">
                    {order.delivery.link}
                  </a>
                  <span className="block text-xs text-yellow-300 mt-1">
                    Only open delivery links you expect, and never enter passwords or bank details on them.
                  </span>
                </p>
              )}
            </Card>
          )}

          <Actions
            order={order}
            isClient={isClient}
            isStudent={isStudent}
            busy={busy}
            act={act}
            autoReleaseDays={autoReleaseDays}
            active={active}
          />

          {order.status === "completed" && (
            <ReviewBox
              order={order}
              other={other}
              myReview={myReview}
              reviews={reviews}
              act={act}
              busy={busy}
              user={user}
            />
          )}
        </div>

        <div className="space-y-5">
          <Chat order={order} messages={messages} user={user} reload={loadMessages} />
          <ReportBox order={order} other={other} />
        </div>
      </div>
    </PageShell>
  );
}

function Actions({ order, isClient, isStudent, busy, act, autoReleaseDays, active }) {
  const [deliver, setDeliver] = useState({ note: "", link: "" });
  const [revNote, setRevNote] = useState("");
  const [showRevision, setShowRevision] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [dispute, setDispute] = useState({ reason: "", details: "" });
  const post = (path, body) => () => api.post(`/orders/${order._id}/${path}`, body);

  const blocks = [];

  if (order.status === "pending" && isStudent) {
    blocks.push(
      <div key="pending-s" className="flex gap-2">
        <button disabled={busy} className={btnPrimary} onClick={() => act(post("accept"), "Order accepted. You can start working.")}>Accept order</button>
        <button disabled={busy} className={btnDanger} onClick={() => act(post("decline"), "Order declined. The client was refunded.")}>Decline</button>
      </div>,
    );
  }
  if (order.status === "pending" && isClient) {
    blocks.push(
      <div key="pending-c">
        <p className="text-sm text-gray-300 mb-2">Waiting for the freelancer to accept. Your money is safe in escrow.</p>
        <button disabled={busy} className={btnDanger} onClick={() => act(post("decline"), "Order cancelled and refunded.")}>Cancel & refund</button>
      </div>,
    );
  }
  if (order.status === "in-progress" && isStudent) {
    blocks.push(
      <form
        key="deliver"
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          act(post("deliver", { note: deliver.note, link: deliver.link }), "Delivered. Waiting for the client to approve.");
        }}
      >
        <h3 className="text-white font-semibold">Deliver your work</h3>
        <textarea required minLength={3} rows={3} className={inputCls} placeholder="What are you delivering?" value={deliver.note} onChange={(e) => setDeliver({ ...deliver, note: e.target.value })} />
        <input type="url" className={inputCls} placeholder="Link to files (Google Drive, GitHub...) - optional" value={deliver.link} onChange={(e) => setDeliver({ ...deliver, link: e.target.value })} />
        <button disabled={busy} className={btnPrimary}>Submit delivery</button>
      </form>,
    );
  }
  if (order.status === "in-progress" && isClient) {
    blocks.push(<p key="ip-c" className="text-sm text-gray-300">The freelancer is working on your order. Funds stay in escrow until you approve.</p>);
  }
  if (order.status === "delivered" && isClient) {
    blocks.push(
      <div key="approve" className="space-y-3">
        <p className="text-sm text-gray-300">
          Happy with the work? Approving releases {money(order.escrow.amount)} to the freelancer. If you do nothing, it is released automatically after {autoReleaseDays} days.
        </p>
        <div className="flex flex-wrap gap-2">
          <button disabled={busy} className={btnPrimary} onClick={() => act(post("approve"), "Approved. Payment released.")}>Approve & release payment</button>
          {order.revisions < 2 && (
            <button disabled={busy} className={btnGhost} onClick={() => setShowRevision((s) => !s)}>Request revision</button>
          )}
        </div>
        {showRevision && (
          <div className="space-y-2">
            <textarea rows={3} className={inputCls} placeholder="What should change?" value={revNote} onChange={(e) => setRevNote(e.target.value)} />
            <button
              disabled={busy || revNote.length < 3}
              className={btnPrimary}
              onClick={() => act(post("revision", { note: revNote }), "Revision requested.").then(() => { setRevNote(""); setShowRevision(false); })}
            >
              Send revision request
            </button>
          </div>
        )}
      </div>,
    );
  }
  if (order.status === "delivered" && isStudent) {
    blocks.push(<p key="del-s" className="text-sm text-gray-300">Waiting for the client to review. Funds are released automatically after {autoReleaseDays} days if they do not respond.</p>);
  }
  if (order.status === "disputed") {
    blocks.push(<p key="disp" className="text-sm text-orange-300">This order is in dispute. An admin is reviewing it and will either release the payment or refund the client.</p>);
  }
  if (order.status === "cancelled") {
    blocks.push(<p key="canc" className="text-sm text-gray-300">This order was cancelled. Escrow: {order.escrow.status}.</p>);
  }
  if (order.status === "completed") {
    blocks.push(<p key="done" className="text-sm text-emerald-300">Completed. Payment released to the freelancer.</p>);
  }

  if (active) {
    blocks.push(
      <div key="dispute" className="pt-3 border-t border-[#0f3d34]">
        <button className="text-sm text-orange-300 underline" onClick={() => setShowDispute((s) => !s)}>
          Something wrong? Open a dispute
        </button>
        {showDispute && (
          <form
            className="mt-3 space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              act(post("dispute", dispute), "Dispute opened. An admin will review it.");
            }}
          >
            <input required minLength={3} maxLength={80} className={inputCls} placeholder="Reason (short)" value={dispute.reason} onChange={(e) => setDispute({ ...dispute, reason: e.target.value })} />
            <textarea rows={3} className={inputCls} placeholder="Details" value={dispute.details} onChange={(e) => setDispute({ ...dispute, details: e.target.value })} />
            <button disabled={busy} className={btnDanger}>Open dispute</button>
          </form>
        )}
      </div>,
    );
  }

  return <Card className="space-y-4">{blocks}</Card>;
}

function ReviewBox({ order, other, myReview, reviews, act, busy, user }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  return (
    <Card>
      <h3 className="text-white font-semibold mb-3">Reviews</h3>
      {reviews.map((r) => (
        <div key={r._id} className="mb-3 text-sm">
          <p className="text-yellow-300">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
          <p className="text-gray-300">{r.comment || "(no comment)"}</p>
          <p className="text-xs text-gray-500">{r.reviewer === user._id ? "You" : other?.name}</p>
        </div>
      ))}
      {!myReview && (
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            act(() => api.post(`/orders/${order._id}/review`, { rating, comment }), "Thanks for your review!");
          }}
        >
          <p className="text-sm text-gray-300">Rate {other?.name}</p>
          <select className={inputCls} value={rating} onChange={(e) => setRating(Number(e.target.value))}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
            ))}
          </select>
          <textarea rows={2} className={inputCls} placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
          <button disabled={busy} className={btnPrimary}>Submit review</button>
        </form>
      )}
    </Card>
  );
}

function Chat({ order, messages, user, reload }) {
  const [text, setText] = useState("");
  const [warning, setWarning] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const bottom = useRef(null);
  const closed = ["completed", "cancelled"].includes(order.status);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const r = await api.post(`/orders/${order._id}/messages`, { text });
      setWarning(r.data.warning || null);
      setText("");
      await reload();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <h3 className="text-white font-semibold">Chat</h3>
      <p className="text-xs text-gray-400 mb-3">Keep all talk and payments inside GigMate. Links, phone numbers and payment details are blocked.</p>
      <div className="h-72 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && <p className="text-gray-500 text-sm">No messages yet.</p>}
        {messages.map((m) => {
          const mine = m.sender === user._id;
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-[#18c29c] text-black" : "bg-[#0f3d34] text-gray-100"}`}>
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`text-[10px] mt-1 ${mine ? "text-black/60" : "text-gray-400"}`}>
                  {fmtDateTime(m.createdAt)}{m.flagged && " · flagged"}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>
      {warning && <p className="mt-2 text-xs text-yellow-300">{warning}</p>}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {closed ? (
        <p className="mt-3 text-xs text-gray-500">This order is closed.</p>
      ) : (
        <form onSubmit={send} className="mt-3 flex gap-2">
          <input className={inputCls} maxLength={1000} placeholder="Type a message" value={text} onChange={(e) => setText(e.target.value)} />
          <button disabled={sending} className={btnPrimary}>Send</button>
        </form>
      )}
    </Card>
  );
}

function ReportBox({ order, other }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0][0]);
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/reports", { targetUserId: other._id, orderId: order._id, reason, details });
      setMsg("Report sent to the admin team.");
      setOpen(false);
    } catch (err) {
      setError(errMsg(err));
    }
  }

  return (
    <Card>
      <button className="text-sm text-red-300 underline" onClick={() => setOpen((o) => !o)}>
        Report {other?.name}
      </button>
      {msg && <p className="mt-2 text-sm text-emerald-300">{msg}</p>}
      {open && (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <select className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)}>
            {REPORT_REASONS.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <textarea rows={3} className={inputCls} placeholder="What happened?" value={details} onChange={(e) => setDetails(e.target.value)} />
          <ErrorBox>{error}</ErrorBox>
          <button className={btnDanger}>Send report</button>
        </form>
      )}
    </Card>
  );
}
