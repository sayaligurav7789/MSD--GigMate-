import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, dashboardPathFor } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Stepper from "../components/Stepper";
const STEPS = ["Personal", "Company"];
export default function ClientProfileSetup() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name ?? "",
        email: user?.email ?? "",
        companyName: user?.clientProfile?.companyName ?? "",
        industry: user?.clientProfile?.industry ?? "",
        description: user?.clientProfile?.description ?? "",
    });
    function update(key, value) {
        setProfileData((prev) => ({ ...prev, [key]: value }));
    }
    const stepValid = useMemo(() => {
        switch (step) {
            case 0:
                return profileData.name.trim().length >= 2;
            case 1:
                return (profileData.companyName.trim().length > 0 &&
                    profileData.description.trim().length > 0);
            default:
                return false;
        }
    }, [step, profileData]);
    function next() {
        setError(null);
        if (!stepValid) {
            setError("Please fill in the required fields before continuing.");
            return;
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
    function back() {
        setError(null);
        setStep((s) => Math.max(s - 1, 0));
    }
    async function submit() {
        setError(null);
        if (!profileData.companyName.trim() || !profileData.description.trim()) {
            setStep(1);
            setError("Please complete your company info.");
            return;
        }
        setSaving(true);
        try {
            const { data } = await api.post("/users/client/profile-setup", {
                name: profileData.name.trim(),
                companyName: profileData.companyName.trim(),
                description: profileData.description.trim(),
                industry: profileData.industry.trim(),
            });
            setUser(data.user);
            navigate(dashboardPathFor("client"), { replace: true });
        }
        catch (err) {
            setError(err?.response?.data?.message || "Failed to save profile");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "max-w-2xl mx-auto px-6 py-10", children: [_jsx("h1", { className: "text-white text-3xl font-semibold", children: "Set up your company profile" }), _jsx("p", { className: "text-gray-400 mt-2 mb-6", children: "Help freelancers understand who they'd be working with." }), _jsxs("div", { className: "rounded-2xl border border-[#0f3d34] bg-[#062a23] p-6", children: [_jsx(Stepper, { steps: STEPS, current: step }), _jsxs("div", { className: "animate-step space-y-4", children: [step === 0 && (_jsxs(_Fragment, { children: [_jsx(Field, { label: "Your name", value: profileData.name, onChange: (v) => update("name", v), required: true, placeholder: "Your full name" }), _jsx(Field, { label: "Email (cannot be changed)", value: profileData.email, onChange: () => { }, readOnly: true })] })), step === 1 && (_jsxs(_Fragment, { children: [_jsx(Field, { label: "Company name", value: profileData.companyName, onChange: (v) => update("companyName", v), required: true, placeholder: "Acme Studio" }), _jsx(Field, { label: "Industry", value: profileData.industry, onChange: (v) => update("industry", v), placeholder: "e.g. SaaS, E-commerce, Education" }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Description" }), _jsx("textarea", { rows: 4, required: true, value: profileData.description, onChange: (e) => update("description", e.target.value), placeholder: "What does your company do?", className: "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" })] })] }))] }, step), error && _jsx("p", { className: "text-red-400 text-sm mt-4", children: error }), _jsxs("div", { className: "mt-6 flex items-center justify-between gap-3", children: [_jsx("button", { type: "button", onClick: back, disabled: step === 0 || saving, className: "px-4 py-2 rounded-xl border border-[#0f3d34] text-gray-200 hover:bg-[#0a3429] disabled:opacity-40", children: "Back" }), step < STEPS.length - 1 ? (_jsx("button", { type: "button", onClick: next, disabled: !stepValid, className: "px-5 py-2.5 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-50", children: "Next" })) : (_jsx("button", { type: "button", onClick: submit, disabled: saving || !stepValid, className: "px-5 py-2.5 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-60", children: saving ? "Saving..." : "Complete Profile" }))] })] })] }));
}
function Field({ label, value, onChange, required, placeholder, readOnly, }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: label }), _jsx("input", { required: required, readOnly: readOnly, value: value, placeholder: placeholder, onChange: (e) => onChange(e.target.value), className: [
                    "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]",
                    readOnly ? "opacity-70 cursor-not-allowed" : "",
                ].join(" ") })] }));
}
