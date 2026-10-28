import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
export default function Profile() {
    const { user, refresh } = useAuth();
    const [form, setForm] = useState({
        name: "",
        college: "",
        bio: "",
        skills: "",
        portfolioLinks: "",
        companyName: "",
        description: "",
        industry: "",
    });
    const [msg, setMsg] = useState(null);
    const [saving, setSaving] = useState(false);
    useEffect(() => {
        if (!user)
            return;
        setForm({
            name: user.name,
            college: user.studentProfile?.college || "",
            bio: user.studentProfile?.bio || "",
            skills: user.studentProfile?.skills?.join(", ") || "",
            portfolioLinks: user.studentProfile?.portfolioLinks?.join(", ") || "",
            companyName: user.clientProfile?.companyName || "",
            description: user.clientProfile?.description || "",
            industry: user.clientProfile?.industry || "",
        });
    }, [user]);
    if (!user)
        return null;
    async function save(e) {
        e.preventDefault();
        setSaving(true);
        setMsg(null);
        try {
            const payload = { name: form.name };
            if (user.role === "student") {
                payload.college = form.college;
                payload.bio = form.bio;
                payload.skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
                payload.portfolioLinks = form.portfolioLinks.split(",").map((s) => s.trim()).filter(Boolean);
            }
            else {
                payload.companyName = form.companyName;
                payload.description = form.description;
                payload.industry = form.industry;
            }
            await api.put("/users/me", payload);
            await refresh();
            setMsg("Profile updated.");
        }
        catch (e) {
            setMsg(e?.response?.data?.message || "Failed to save");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "max-w-2xl mx-auto px-6 py-10", children: [_jsx("h1", { className: "text-white text-3xl font-semibold mb-2", children: "My profile" }), _jsxs("p", { className: "text-gray-400 mb-6", children: ["Signed in as ", _jsx("span", { className: "text-[#18c29c]", children: user.email }), " (", user.role, ")"] }), _jsxs("form", { onSubmit: save, className: "space-y-4 rounded-2xl border border-[#0f3d34] bg-[#062a23] p-6", children: [_jsx(Field, { label: "Name", value: form.name, onChange: (v) => setForm({ ...form, name: v }), required: true }), user.role === "student" ? (_jsxs(_Fragment, { children: [_jsx(Field, { label: "College", value: form.college, onChange: (v) => setForm({ ...form, college: v }) }), _jsx(Field, { label: "Skills (comma separated)", value: form.skills, onChange: (v) => setForm({ ...form, skills: v }) }), _jsx(Field, { label: "Portfolio links (comma separated)", value: form.portfolioLinks, onChange: (v) => setForm({ ...form, portfolioLinks: v }) }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Bio" }), _jsx("textarea", { rows: 4, value: form.bio, onChange: (e) => setForm({ ...form, bio: e.target.value }), className: "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" })] })] })) : (_jsxs(_Fragment, { children: [_jsx(Field, { label: "Company name", value: form.companyName, onChange: (v) => setForm({ ...form, companyName: v }) }), _jsx(Field, { label: "Industry", value: form.industry, onChange: (v) => setForm({ ...form, industry: v }) }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Description" }), _jsx("textarea", { rows: 4, value: form.description, onChange: (e) => setForm({ ...form, description: e.target.value }), className: "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" })] })] })), msg && _jsx("p", { className: "text-sm text-gray-300", children: msg }), _jsx("button", { disabled: saving, className: "w-full py-2.5 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-60", children: saving ? "Saving..." : "Save changes" })] })] }));
}
function Field({ label, value, onChange, required, }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: label }), _jsx("input", { required: required, value: value, onChange: (e) => onChange(e.target.value), className: "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" })] }));
}
