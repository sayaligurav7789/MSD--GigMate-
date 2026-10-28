import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
export default function Dashboard() {
    const { user } = useAuth();
    if (!user)
        return null;
    return user.role === "student" ? _jsx(StudentDashboard, {}) : _jsx(ClientDashboard, {});
}
function StudentDashboard() {
    const [gigs, setGigs] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    async function load() {
        setLoading(true);
        const [g, o] = await Promise.all([
            api.get("/gigs/mine/list"),
            api.get("/orders"),
        ]);
        setGigs(g.data.gigs);
        setOrders(o.data.orders);
        setLoading(false);
    }
    useEffect(() => {
        load();
    }, []);
    async function remove(id) {
        if (!confirm("Delete this gig?"))
            return;
        await api.delete(`/gigs/${id}`);
        load();
    }
    const earnings = orders
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + o.price, 0);
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-6 py-10", children: [_jsx("h1", { className: "text-white text-3xl font-semibold", children: "Freelancer Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6", children: [_jsx(Stat, { label: "Active gigs", value: gigs.filter((g) => g.isActive).length }), _jsx(Stat, { label: "Active orders", value: orders.filter((o) => o.status !== "completed" && o.status !== "cancelled").length }), _jsx(Stat, { label: "Total earnings", value: `₹${earnings}` })] }), _jsxs("div", { className: "mt-10 flex items-center justify-between", children: [_jsx("h2", { className: "text-white text-xl font-semibold", children: "My gigs" }), _jsx(Link, { to: "/gigs/new", className: "px-4 py-2 rounded-md bg-[#18c29c] text-black font-semibold hover:opacity-90 text-sm", children: "+ New gig" })] }), loading ? (_jsx("p", { className: "text-gray-400 mt-4", children: "Loading..." })) : gigs.length === 0 ? (_jsx("p", { className: "text-gray-400 mt-4", children: "You haven't created any gigs yet." })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4", children: gigs.map((g) => (_jsxs("div", { className: "rounded-xl border border-[#0f3d34] bg-[#062a23] p-5", children: [_jsxs("div", { className: "flex items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs text-[#18c29c] uppercase", children: g.category }), _jsx("h3", { className: "text-white font-semibold", children: g.title }), _jsx("p", { className: "text-gray-400 text-sm mt-1 line-clamp-2", children: g.description })] }), _jsxs("span", { className: "text-white font-semibold whitespace-nowrap", children: ["\u20B9", g.price] })] }), _jsxs("div", { className: "mt-3 flex gap-2", children: [_jsx(Link, { to: `/gigs/${g._id}`, className: "text-xs px-3 py-1 rounded-md border border-[#0f3d34] text-gray-200 hover:bg-[#0f3d34]", children: "View" }), _jsx(Link, { to: `/gigs/${g._id}/edit`, className: "text-xs px-3 py-1 rounded-md border border-[#0f3d34] text-gray-200 hover:bg-[#0f3d34]", children: "Edit" }), _jsx("button", { onClick: () => remove(g._id), className: "text-xs px-3 py-1 rounded-md border border-red-900 text-red-300 hover:bg-red-900/30", children: "Delete" })] })] }, g._id))) }))] }));
}
function ClientDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        api
            .get("/orders")
            .then((r) => setOrders(r.data.orders))
            .finally(() => setLoading(false));
    }, []);
    const spent = orders
        .filter((o) => o.status === "completed")
        .reduce((s, o) => s + o.price, 0);
    return (_jsxs("div", { className: "max-w-7xl mx-auto px-6 py-10", children: [_jsx("h1", { className: "text-white text-3xl font-semibold", children: "Client Dashboard" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6", children: [_jsx(Stat, { label: "Total orders", value: orders.length }), _jsx(Stat, { label: "In progress", value: orders.filter((o) => o.status === "in-progress").length }), _jsx(Stat, { label: "Total spent", value: `₹${spent}` })] }), _jsxs("div", { className: "mt-10 flex items-center justify-between", children: [_jsx("h2", { className: "text-white text-xl font-semibold", children: "Recent orders" }), _jsx(Link, { to: "/gigs", className: "px-4 py-2 rounded-md bg-[#18c29c] text-black font-semibold hover:opacity-90 text-sm", children: "Browse gigs" })] }), loading ? (_jsx("p", { className: "text-gray-400 mt-4", children: "Loading..." })) : orders.length === 0 ? (_jsx("p", { className: "text-gray-400 mt-4", children: "You haven't placed any orders yet." })) : (_jsx("div", { className: "mt-4 rounded-xl border border-[#0f3d34] overflow-hidden", children: orders.slice(0, 6).map((o) => (_jsxs("div", { className: "flex items-center justify-between px-5 py-4 border-b border-[#0f3d34] last:border-b-0 bg-[#062a23]", children: [_jsxs("div", { children: [_jsx("p", { className: "text-white", children: o.title || o.gig?.title || "Order" }), _jsxs("p", { className: "text-xs text-gray-400", children: ["with ", o.student?.name] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(StatusBadge, { status: o.status }), _jsxs("span", { className: "text-white", children: ["\u20B9", o.price] })] })] }, o._id))) }))] }));
}
function Stat({ label, value }) {
    return (_jsxs("div", { className: "rounded-xl border border-[#0f3d34] bg-[#062a23] p-5", children: [_jsx("p", { className: "text-xs text-gray-400 uppercase tracking-wide", children: label }), _jsx("p", { className: "text-white text-2xl font-semibold mt-1", children: value })] }));
}
export function StatusBadge({ status }) {
    const map = {
        pending: "bg-yellow-900/40 text-yellow-300 border-yellow-800",
        "in-progress": "bg-blue-900/40 text-blue-300 border-blue-800",
        completed: "bg-emerald-900/40 text-emerald-300 border-emerald-800",
        cancelled: "bg-red-900/40 text-red-300 border-red-800",
    };
    return (_jsx("span", { className: `text-xs px-2 py-0.5 rounded-full border ${map[status]}`, children: status }));
}
