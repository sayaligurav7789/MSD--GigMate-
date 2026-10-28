import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const services = [
    { icon: "💻", title: "Web Development", desc: "Static sites, full-stack apps, integrations" },
    { icon: "🎨", title: "Graphic Design", desc: "Logos, brand identity, social media" },
    { icon: "🎬", title: "Video Editing", desc: "Reels, YouTube, motion graphics" },
    { icon: "✍️", title: "Writing", desc: "Blogs, copywriting, technical docs" },
    { icon: "🤖", title: "AI & ML", desc: "Prompt engineering, fine-tuning, chatbots" },
    { icon: "📱", title: "Mobile Apps", desc: "iOS, Android, React Native, Flutter" },
];
export default function Services() {
    return (_jsxs("section", { className: "max-w-7xl mx-auto px-6 py-16", children: [_jsx("h2", { className: "text-white text-3xl font-semibold mb-2", children: "Popular categories" }), _jsx("p", { className: "text-gray-400 mb-10", children: "Hand-picked work from verified student freelancers." }), _jsx("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-4", children: services.map((s) => (_jsxs("div", { className: "rounded-xl border border-[#0f3d34] bg-[#062a23] p-6 hover:border-[#18c29c] transition", children: [_jsx("div", { className: "text-3xl mb-3", children: s.icon }), _jsx("h3", { className: "text-white font-medium", children: s.title }), _jsx("p", { className: "text-gray-400 text-sm mt-1", children: s.desc })] }, s.title))) })] }));
}
