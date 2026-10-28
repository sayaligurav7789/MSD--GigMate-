import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, dashboardPathFor } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import Stepper from "../components/Stepper";
import TagInput from "../components/TagInput";
const STEPS = ["Personal", "Education", "Skills", "Portfolio"];
export default function StudentProfileSetup() {
    const { user, setUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState({
        name: user?.name ?? "",
        email: user?.email ?? "",
        bio: user?.studentProfile?.bio ?? "",
        college: user?.studentProfile?.college ?? "",
        degree: user?.studentProfile?.degree ?? "",
        year: user?.studentProfile?.year ?? "",
        skills: user?.studentProfile?.skills ?? [],
        portfolioLinks: user?.studentProfile?.portfolioLinks ?? [],
        projects: user?.studentProfile?.projects ?? [],
    });
    function update(key, value) {
        setProfileData((prev) => ({ ...prev, [key]: value }));
    }
    const stepValid = useMemo(() => {
        switch (step) {
            case 0:
                return profileData.name.trim().length >= 2;
            case 1:
                return profileData.college.trim().length > 0;
            case 2:
                return profileData.skills.length > 0;
            case 3:
                return true;
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
        if (profileData.skills.length === 0) {
            setStep(2);
            setError("Please add at least one skill.");
            return;
        }
        setSaving(true);
        try {
            const { data } = await api.post("/users/student/profile-setup", {
                name: profileData.name.trim(),
                college: profileData.college.trim(),
                degree: profileData.degree.trim(),
                year: profileData.year.trim(),
                bio: profileData.bio.trim(),
                skills: profileData.skills,
                portfolioLinks: profileData.portfolioLinks,
                projects: profileData.projects,
            });
            setUser(data.user);
            navigate(dashboardPathFor("student"), { replace: true });
        }
        catch (err) {
            setError(err?.response?.data?.message || "Failed to save profile");
        }
        finally {
            setSaving(false);
        }
    }
    return (_jsxs("div", { className: "max-w-2xl mx-auto px-6 py-10", children: [_jsx("h1", { className: "text-white text-3xl font-semibold", children: "Set up your freelancer profile" }), _jsx("p", { className: "text-gray-400 mt-2 mb-6", children: "A few quick steps so clients can hire you with confidence." }), _jsxs("div", { className: "rounded-2xl border border-[#0f3d34] bg-[#062a23] p-6", children: [_jsx(Stepper, { steps: STEPS, current: step }), _jsxs("div", { className: "animate-step space-y-4", children: [step === 0 && (_jsx(PersonalStep, { name: profileData.name, email: profileData.email, bio: profileData.bio, onName: (v) => update("name", v), onBio: (v) => update("bio", v) })), step === 1 && (_jsx(EducationStep, { college: profileData.college, degree: profileData.degree, year: profileData.year, onCollege: (v) => update("college", v), onDegree: (v) => update("degree", v), onYear: (v) => update("year", v) })), step === 2 && (_jsx(SkillsStep, { skills: profileData.skills, onSkills: (v) => update("skills", v) })), step === 3 && (_jsx(PortfolioStep, { portfolioLinks: profileData.portfolioLinks, projects: profileData.projects, onPortfolioLinks: (v) => update("portfolioLinks", v), onProjects: (v) => update("projects", v) }))] }, step), error && _jsx("p", { className: "text-red-400 text-sm mt-4", children: error }), _jsxs("div", { className: "mt-6 flex items-center justify-between gap-3", children: [_jsx("button", { type: "button", onClick: back, disabled: step === 0 || saving, className: "px-4 py-2 rounded-xl border border-[#0f3d34] text-gray-200 hover:bg-[#0a3429] disabled:opacity-40", children: "Back" }), step < STEPS.length - 1 ? (_jsx("button", { type: "button", onClick: next, disabled: !stepValid, className: "px-5 py-2.5 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-50", children: "Next" })) : (_jsx("button", { type: "button", onClick: submit, disabled: saving, className: "px-5 py-2.5 rounded-xl bg-[#18c29c] text-black font-semibold hover:opacity-90 disabled:opacity-60", children: saving ? "Saving..." : "Complete Profile" }))] })] })] }));
}
function PersonalStep({ name, email, bio, onName, onBio, }) {
    return (_jsxs(_Fragment, { children: [_jsx(Field, { label: "Full name", value: name, onChange: onName, required: true, placeholder: "Your full name" }), _jsx(Field, { label: "Email (cannot be changed)", value: email, onChange: () => { }, readOnly: true }), _jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: "Short bio" }), _jsx("textarea", { rows: 4, value: bio, onChange: (e) => onBio(e.target.value), placeholder: "Briefly describe your experience and what you love working on.", className: "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]" })] })] }));
}
function EducationStep({ college, degree, year, onCollege, onDegree, onYear, }) {
    return (_jsxs(_Fragment, { children: [_jsx(Field, { label: "College / University", value: college, onChange: onCollege, required: true, placeholder: "e.g. IIT Bombay" }), _jsx(Field, { label: "Degree (optional)", value: degree, onChange: onDegree, placeholder: "e.g. B.Tech Computer Science" }), _jsx(Field, { label: "Year (optional)", value: year, onChange: onYear, placeholder: "e.g. 3rd year, 2026" })] }));
}
function SkillsStep({ skills, onSkills, }) {
    return (_jsx(TagInput, { label: "Skills", values: skills, onChange: onSkills, placeholder: "Type a skill and press Enter", helper: "Add at least one skill. Press Enter or comma to add." }));
}
function PortfolioStep({ portfolioLinks, projects, onPortfolioLinks, onProjects, }) {
    return (_jsxs(_Fragment, { children: [_jsx(TagInput, { label: "Portfolio links (optional)", values: portfolioLinks, onChange: onPortfolioLinks, placeholder: "https://github.com/you", helper: "Add links to your GitHub, Dribbble, personal site, etc." }), _jsx(TagInput, { label: "Projects (optional)", values: projects, onChange: onProjects, placeholder: "Project name or short description", helper: "Highlight a few projects you're proud of." })] }));
}
function Field({ label, value, onChange, required, placeholder, readOnly, }) {
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: label }), _jsx("input", { required: required, readOnly: readOnly, value: value, placeholder: placeholder, onChange: (e) => onChange(e.target.value), className: [
                    "mt-1 w-full px-3 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] text-white outline-none focus:border-[#18c29c]",
                    readOnly ? "opacity-70 cursor-not-allowed" : "",
                ].join(" ") })] }));
}
