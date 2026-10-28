// Small shared UI pieces so pages stay readable.
import { Link } from "react-router-dom";

export const inputCls =
  "w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]";
export const btnPrimary =
  "px-4 py-2 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-60 text-sm";
export const btnGhost =
  "px-3 py-1.5 rounded-md border border-[#0f3d34] text-gray-200 hover:bg-[#0f3d34] text-sm disabled:opacity-60";
export const btnDanger =
  "px-3 py-1.5 rounded-md bg-red-900/40 text-red-200 border border-red-800 hover:bg-red-900/60 text-sm disabled:opacity-60";

export const errMsg = (e, fallback = "Something went wrong") =>
  e?.response?.data?.message || e?.message || fallback;

export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
export const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "";

export function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-[#0f3d34] bg-[#062a23] p-5 ${className}`}>{children}</div>;
}

export function PageShell({ title, subtitle, actions, children, narrow = false }) {
  return (
    <div className={`${narrow ? "max-w-3xl" : "max-w-6xl"} mx-auto px-6 py-10`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-white text-3xl font-semibold">{title}</h1>
          {subtitle && <p className="text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return <p className="text-sm text-red-300 bg-red-900/30 border border-red-800 rounded-md px-3 py-2">{children}</p>;
}

export function NoticeBox({ children }) {
  if (!children) return null;
  return <p className="text-sm text-[#a7f3da] bg-[#18c29c]/10 border border-[#18c29c]/40 rounded-md px-3 py-2">{children}</p>;
}

const STATUS_STYLES = {
  pending: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  open: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  "in-progress": "bg-blue-900/40 text-blue-300 border-blue-800",
  assigned: "bg-blue-900/40 text-blue-300 border-blue-800",
  delivered: "bg-purple-900/40 text-purple-300 border-purple-800",
  completed: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  accepted: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  cancelled: "bg-red-900/40 text-red-300 border-red-800",
  rejected: "bg-red-900/40 text-red-300 border-red-800",
  withdrawn: "bg-gray-800 text-gray-300 border-gray-700",
  disputed: "bg-orange-900/40 text-orange-300 border-orange-800",
  held: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
  released: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  refunded: "bg-gray-800 text-gray-300 border-gray-700",
  verified: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
  none: "bg-gray-800 text-gray-300 border-gray-700",
};

export function StatusBadge({ status }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] || STATUS_STYLES.none}`}>
      {status}
    </span>
  );
}

export function TrustBadge({ user }) {
  if (!user || user.role === "admin") return null;
  const score = user.trustScore ?? 0;
  const color = score >= 70 ? "text-emerald-300" : score >= 40 ? "text-yellow-300" : "text-red-300";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border border-[#0f3d34] ${color}`} title="Trust score (0-100)">
      Trust {score}
    </span>
  );
}

export function VerifiedBadge({ user }) {
  if (user?.verification?.status !== "verified") return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border border-[#18c29c]/50 bg-[#18c29c]/10 text-[#18c29c]">
      ✓ Verified {user.role === "student" ? "Student" : "Client"}
    </span>
  );
}

export function NewTalentBadge({ user }) {
  if (user?.role !== "student" || (user.stats?.completedOrders ?? 0) >= 3) return null;
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border border-blue-700 bg-blue-900/30 text-blue-300">
      New Talent
    </span>
  );
}

export function Stars({ avg, count }) {
  if (!count) return <span className="text-xs text-gray-500">No reviews yet</span>;
  return (
    <span className="text-xs text-yellow-300">
      ★ {avg} <span className="text-gray-400">({count})</span>
    </span>
  );
}

export function UserChip({ user }) {
  if (!user) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Link to={`/users/${user._id}`} className="text-white hover:underline">
        {user.name}
      </Link>
      <VerifiedBadge user={user} />
      <NewTalentBadge user={user} />
      <TrustBadge user={user} />
    </span>
  );
}
