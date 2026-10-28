import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function Stepper({ steps, current }) {
    const total = steps.length;
    const progress = total <= 1 ? 100 : (current / (total - 1)) * 100;
    return (_jsxs("div", { className: "mb-8", children: [_jsx("ol", { className: "flex items-center justify-between gap-2", children: steps.map((label, i) => {
                    const isDone = i < current;
                    const isActive = i === current;
                    return (_jsxs("li", { className: "flex-1 flex items-center gap-3 min-w-0", children: [_jsx("div", { className: [
                                    "shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border transition-colors",
                                    isActive
                                        ? "bg-[#18c29c] text-black border-[#18c29c]"
                                        : isDone
                                            ? "bg-[#0f3d34] text-[#18c29c] border-[#18c29c]"
                                            : "bg-[#062a23] text-gray-400 border-[#0f3d34]",
                                ].join(" "), children: isDone ? "✓" : i + 1 }), _jsx("span", { className: [
                                    "text-sm truncate hidden sm:inline",
                                    isActive ? "text-white" : isDone ? "text-gray-300" : "text-gray-500",
                                ].join(" "), children: label })] }, label));
                }) }), _jsx("div", { className: "mt-4 h-1.5 w-full rounded-full bg-[#0f3d34] overflow-hidden", children: _jsx("div", { className: "h-full bg-[#18c29c] transition-all duration-500 ease-out", style: { width: `${progress}%` } }) }), _jsxs("p", { className: "mt-2 text-xs text-gray-500", children: ["Step ", current + 1, " of ", total, " \u2014 ", steps[current]] })] }));
}
