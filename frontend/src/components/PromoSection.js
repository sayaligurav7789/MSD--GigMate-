import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
export default function PromoSection() {
    return (_jsx("section", { className: "max-w-7xl mx-auto px-6 py-16", children: _jsxs("div", { className: "rounded-2xl border border-[#0f3d34] bg-gradient-to-br from-[#062a23] to-[#031c17] p-10 md:p-14 flex flex-col md:flex-row items-start md:items-center justify-between gap-6", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-white text-3xl font-semibold", children: "Are you a student?" }), _jsx("p", { className: "text-gray-300 mt-2 max-w-xl", children: "Earn money on your own schedule. List your services, set your prices, and get paid directly to your bank or UPI." })] }), _jsx(Link, { to: "/signup", className: "px-6 py-3 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90", children: "Become a Seller \u2192" })] }) }));
}
