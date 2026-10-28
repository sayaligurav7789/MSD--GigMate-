import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
export default function TagInput({ label, values, onChange, placeholder, helper }) {
    const [draft, setDraft] = useState("");
    function commit(raw) {
        const parts = raw
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (parts.length === 0)
            return;
        const next = [...values];
        for (const p of parts) {
            if (!next.includes(p))
                next.push(p);
        }
        onChange(next);
        setDraft("");
    }
    function onKey(e) {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            commit(draft);
        }
        else if (e.key === "Backspace" && draft === "" && values.length > 0) {
            onChange(values.slice(0, -1));
        }
    }
    function remove(i) {
        const next = values.slice();
        next.splice(i, 1);
        onChange(next);
    }
    return (_jsxs("label", { className: "block", children: [_jsx("span", { className: "text-xs text-gray-400", children: label }), _jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-2 px-2 py-2 rounded-md bg-[#031c17] border border-[#0f3d34] focus-within:border-[#18c29c]", children: [values.map((v, i) => (_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#0f3d34] text-[#cfeee5] text-xs", children: [v, _jsx("button", { type: "button", onClick: () => remove(i), className: "text-gray-400 hover:text-white", "aria-label": `Remove ${v}`, children: "\u00D7" })] }, `${v}-${i}`))), _jsx("input", { value: draft, onChange: (e) => setDraft(e.target.value), onKeyDown: onKey, onBlur: () => draft && commit(draft), placeholder: values.length === 0 ? placeholder : "", className: "flex-1 min-w-[140px] bg-transparent text-white text-sm outline-none py-0.5" })] }), helper && _jsx("span", { className: "mt-1 block text-[11px] text-gray-500", children: helper })] }));
}
