import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function SignupModal() {
    const [step, setStep] = useState("role");
    const [role, setRole] = useState("student");
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();
    function update(k, v) {
        setForm((f) => ({ ...f, [k]: v }));
    }
    async function submit(e) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const payload = {
                name: form.name,
                email: form.email,
                password: form.password,
                role,
            };
            await signup(payload);
            // No auto-login. Send the user to the login page with a friendly message
            // and prefill their email.
            navigate("/login", {
                replace: true,
                state: {
                    notice: "Account created successfully. Please sign in to continue.",
                    email: form.email,
                },
            });
        }
        catch (err) {
            setError(err?.response?.data?.message || "Signup failed");
        }
        finally {
            setLoading(false);
        }
    }
    return (_jsx("div", { className: "fixed inset-0 bg-[#021b16]/90 backdrop-blur-md flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "w-full max-w-[520px] rounded-2xl border border-[#0f3d34] bg-gradient-to-b from-[#062a23] to-[#031c17] p-6 shadow-xl", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 bg-[#18c29c] rounded-md flex items-center justify-center text-black font-bold", children: "g" }), _jsx("h1", { className: "text-white font-semibold text-lg", children: "GigMate" })] }), _jsx("button", { onClick: () => navigate(-1), className: "text-gray-400 hover:text-white text-2xl leading-none", children: "\u00D7" })] }), _jsx("div", { className: "w-full h-[3px] bg-[#0f3d34] rounded-full mb-6", children: _jsx("div", { className: "h-full bg-[#18c29c] rounded-full transition-all", style: { width: step === "role" ? "50%" : "100%" } }) }), step === "role" ? (_jsxs(_Fragment, { children: [_jsx("h2", { className: "text-white text-2xl font-semibold mb-2", children: "Join GigMate as a..." }), _jsx("p", { className: "text-gray-400 text-sm mb-6", children: "Pick your role to get a tailored experience." }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-6", children: [_jsx(RoleCard, { active: role === "student", onClick: () => setRole("student"), icon: "\uD83C\uDF93", title: "Student Freelancer", desc: "I want to offer services and earn money", bullets: ["Post unlimited gigs", "Build your portfolio", "Get paid via UPI"] }), _jsx(RoleCard, { active: role === "client", onClick: () => setRole("client"), icon: "\uD83D\uDCBC", title: "Business / Client", desc: "I want to hire students for tasks", bullets: ["Post tasks for free", "Access verified students", "Fast delivery"] })] }), _jsxs("button", { onClick: () => setStep("details"), className: "w-full py-3 rounded-xl bg-gradient-to-r from-[#18c29c] to-[#0ea37f] text-black font-semibold hover:opacity-90", children: ["Continue as ", role === "student" ? "Student Freelancer" : "Client", " \u2192"] }), _jsxs("p", { className: "text-center text-xs text-gray-400 mt-4", children: ["Already have an account?", " ", _jsx("span", { onClick: () => navigate("/login"), className: "text-[#18c29c] cursor-pointer hover:underline", children: "Log in" })] })] })) : (_jsxs("form", { onSubmit: submit, className: "space-y-3", children: [_jsx("h2", { className: "text-white text-xl font-semibold mb-1", children: "Create your account" }), _jsxs("p", { className: "text-gray-400 text-xs mb-2", children: ["As ", role === "student" ? "Student Freelancer" : "Client", ". You'll set up your profile after you sign in."] }), _jsx(Field, { label: "Full name", value: form.name, onChange: (v) => update("name", v), required: true }), _jsx(Field, { label: "Email", type: "email", value: form.email, onChange: (v) => update("email", v), required: true }), _jsx(Field, { label: "Password (min 6)", type: "password", value: form.password, onChange: (v) => update("password", v), required: true }), error && _jsx("p", { className: "text-red-400 text-sm", children: error }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setStep("role"), className: "flex-1 py-2.5 rounded-xl border border-[#0f3d34] text-gray-200 hover:bg-[#0f3d34]", children: "Back" }), _jsx("button", { disabled: loading, className: "flex-1 py-2.5 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-60", children: loading ? "Creating..." : "Create account" })] })] }))] }) }));
}
function RoleCard({ active, onClick, icon, title, desc, bullets, }) {
    return (_jsxs("div", { onClick: onClick, className: `cursor-pointer rounded-xl p-4 border transition-all ${active ? "border-[#18c29c] shadow-[0_0_12px_#18c29c40]" : "border-[#0f3d34]"}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("span", { className: "text-2xl", children: icon }), active && (_jsx("span", { className: "bg-[#18c29c] text-black text-xs px-2 py-0.5 rounded-full", children: "\u2713" }))] }), _jsx("h3", { className: "text-white font-medium text-sm", children: title }), _jsx("p", { className: "text-gray-400 text-xs mb-2", children: desc }), _jsx("ul", { className: "text-xs text-gray-300 space-y-1", children: bullets.map((b) => (_jsxs("li", { children: ["\u2726 ", b] }, b))) })] }));
}
function Field({ label, value, onChange, type = "text", required, }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: label }), _jsx("input", { type: type, required: required, value: value, onChange: (e) => onChange(e.target.value), className: "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" })] }));
}
