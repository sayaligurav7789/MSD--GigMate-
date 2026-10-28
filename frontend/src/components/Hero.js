import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
export default function Hero() {
    const [q, setQ] = useState("");
    const navigate = useNavigate();
    function search(e) {
        e.preventDefault();
        navigate(`/gigs?q=${encodeURIComponent(q.trim())}`);
    }
    return (_jsxs("section", { className: "relative overflow-hidden border-b border-[#0f3d34]", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#021b16] via-[#03251e] to-[#021b16]" }), _jsx("div", { className: "absolute -top-32 -right-32 w-96 h-96 bg-[#18c29c]/20 rounded-full blur-3xl" }), _jsx("div", { className: "absolute -bottom-32 -left-32 w-96 h-96 bg-[#0e8f7a]/20 rounded-full blur-3xl" }), _jsxs("div", { className: "relative max-w-7xl mx-auto px-6 py-24 md:py-32", children: [_jsxs("h1", { className: "text-white text-4xl md:text-6xl font-bold leading-tight max-w-3xl", children: ["Find the perfect ", _jsx("span", { className: "text-[#18c29c]", children: "student freelancer" }), " for your next project"] }), _jsx("p", { className: "mt-4 text-gray-300 max-w-xl", children: "GigMate connects ambitious student talent with clients who need design, code, writing, and more \u2014 fast, affordable, and verified." }), _jsxs("form", { onSubmit: search, className: "mt-8 flex w-full max-w-2xl rounded-xl bg-[#062a23] border border-[#0f3d34] overflow-hidden", children: [_jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Try 'logo design' or 'react developer'", className: "flex-1 px-5 py-4 bg-transparent text-white placeholder-gray-500 outline-none" }), _jsx("button", { type: "submit", className: "px-6 bg-[#18c29c] text-black font-semibold hover:opacity-90", children: "Search" })] }), _jsx("div", { className: "mt-6 flex flex-wrap gap-2", children: ["Website Development", "Logo Design", "Video Editing", "AI Services", "Content Writing"].map((t) => (_jsx("button", { onClick: () => navigate(`/gigs?q=${encodeURIComponent(t)}`), className: "px-4 py-1.5 rounded-full border border-[#0f3d34] text-gray-300 text-sm hover:border-[#18c29c] hover:text-white", children: t }, t))) })] })] }));
}
