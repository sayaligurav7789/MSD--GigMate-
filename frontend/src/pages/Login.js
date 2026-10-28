import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { postLoginPathFor } from "../lib/api";
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const state = (location.state ?? null);
    useEffect(() => {
        if (state?.email)
            setEmail(state.email);
    }, [state?.email]);
    async function submit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const user = await login(email, password);
            navigate(postLoginPathFor(user), { replace: true });
        }
        catch (err) {
            setError(err?.response?.data?.message || "Login failed");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "min-h-[80vh] flex items-center justify-center px-4", children: _jsxs("form", { onSubmit: submit, className: "w-full max-w-md rounded-2xl border border-[#0f3d34] bg-gradient-to-b from-[#062a23] to-[#031c17] p-8 shadow-xl", children: [_jsx("h1", { className: "text-white text-2xl font-semibold mb-1", children: "Welcome back" }), _jsx("p", { className: "text-gray-400 text-sm mb-6", children: "Sign in to your GigMate account." }), state?.notice && (_jsx("div", { className: "mb-4 rounded-md border border-[#18c29c]/40 bg-[#18c29c]/10 px-3 py-2 text-sm text-[#a7f3da]", children: state.notice })), _jsxs("label", { className: "block mb-3", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Email" }), _jsx("input", { type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" })] }), _jsxs("label", { className: "block mb-4", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Password" }), _jsx("input", { type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" })] }), error && _jsx("p", { className: "text-red-400 text-sm mb-3", children: error }), _jsx("button", { disabled: loading, className: "w-full py-2.5 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-60", children: loading ? "Signing in..." : "Sign in" }), _jsxs("p", { className: "text-center text-sm text-gray-400 mt-5", children: ["New to GigMate?", " ", _jsx(Link, { to: "/signup", className: "text-[#18c29c] hover:underline", children: "Create an account" })] })] }) }));
}
