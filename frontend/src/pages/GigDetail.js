import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
export default function GigDetail() {
    const { id } = useParams();
    const [gig, setGig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requirements, setRequirements] = useState("");
    const [ordering, setOrdering] = useState(false);
    const [orderMsg, setOrderMsg] = useState(null);
    const { user } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
        if (!id)
            return;
        setLoading(true);
        api
            .get(`/gigs/${id}`)
            .then((r) => setGig(r.data.gig))
            .catch((e) => setError(e?.response?.data?.message || "Failed to load gig"))
            .finally(() => setLoading(false));
    }, [id]);
    async function placeOrder() {
        if (!user) {
            navigate("/login");
            return;
        }
        if (user.role !== "client") {
            setOrderMsg("Only clients can place orders.");
            return;
        }
        setOrdering(true);
        setOrderMsg(null);
        try {
            await api.post("/orders", { gigId: id, requirements });
            setOrderMsg("Order placed! Redirecting to your orders…");
            setTimeout(() => navigate("/orders"), 800);
        }
        catch (e) {
            setOrderMsg(e?.response?.data?.message || "Failed to place order");
        }
        finally {
            setOrdering(false);
        }
    }
    if (loading)
        return _jsx("p", { className: "max-w-7xl mx-auto px-6 py-10 text-gray-400", children: "Loading..." });
    if (error || !gig)
        return _jsx("p", { className: "max-w-7xl mx-auto px-6 py-10 text-red-400", children: error || "Not found" });
    const student = typeof gig.student === "object" ? gig.student : null;
    return (_jsxs("div", { className: "max-w-5xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8", children: [_jsxs("div", { className: "md:col-span-2", children: [_jsx("span", { className: "text-xs text-[#18c29c] uppercase tracking-wide", children: gig.category }), _jsx("h1", { className: "text-white text-3xl font-semibold mt-2", children: gig.title }), student && (_jsxs(Link, { to: `/users/${student._id}`, className: "mt-3 inline-flex items-center gap-2 text-gray-300 hover:text-white", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-[#18c29c] text-black font-bold flex items-center justify-center", children: student.name[0]?.toUpperCase() }), _jsx("span", { children: student.name })] })), _jsxs("div", { className: "mt-8 rounded-xl border border-[#0f3d34] bg-[#062a23] p-6", children: [_jsx("h2", { className: "text-white font-semibold mb-2", children: "About this gig" }), _jsx("p", { className: "text-gray-300 whitespace-pre-line", children: gig.description }), gig.skills.length > 0 && (_jsxs(_Fragment, { children: [_jsx("h3", { className: "text-white font-medium mt-6 mb-2", children: "Skills" }), _jsx("div", { className: "flex flex-wrap gap-2", children: gig.skills.map((s) => (_jsx("span", { className: "text-xs px-2 py-1 rounded-full border border-[#0f3d34] text-gray-300", children: s }, s))) })] }))] })] }), _jsxs("aside", { className: "rounded-xl border border-[#0f3d34] bg-[#062a23] p-6 h-fit sticky top-24", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Starting at" }), _jsxs("span", { className: "text-white text-2xl font-bold", children: ["\u20B9", gig.price] })] }), _jsxs("p", { className: "text-gray-400 text-sm mt-1", children: ["Delivery in ", gig.deliveryDays, " days"] }), _jsx("textarea", { rows: 4, placeholder: "Tell the freelancer what you need...", value: requirements, onChange: (e) => setRequirements(e.target.value), className: "mt-4 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" }), _jsx("button", { onClick: placeOrder, disabled: ordering, className: "mt-3 w-full py-2.5 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-60", children: ordering ? "Placing..." : "Place Order" }), orderMsg && _jsx("p", { className: "mt-3 text-sm text-gray-300", children: orderMsg })] })] }));
}
