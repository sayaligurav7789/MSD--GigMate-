import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { CATEGORIES } from "../lib/constants";
import { Card, PageShell, ErrorBox, NoticeBox, inputCls, btnPrimary, errMsg } from "../components/ui";
import TagInput from "../components/TagInput";
import { useAuth } from "../context/AuthContext";

export default function TaskNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: CATEGORIES[0],
    budget: "",
    deadline: "",
    college: user?.clientProfile?.college || "",
  });
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const { data } = await api.post("/tasks", {
        ...form,
        budget: Number(form.budget),
        deadline: new Date(form.deadline).toISOString(),
        skills,
      });
      navigate(`/tasks/${data.task._id}`);
    } catch (err) {
      setError(errMsg(err, "Could not post task"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageShell title="Post a task" subtitle="Describe the job. Students will send you proposals." narrow>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <NoticeBox>Do not put links, phone numbers or payment details here. Chat happens inside GigMate once you hire someone.</NoticeBox>
          <label className="block">
            <span className="text-xs text-gray-400">Title</span>
            <input required minLength={5} maxLength={120} className={inputCls} value={form.title} onChange={set("title")} placeholder="Poster for our college fest" />
          </label>
          <label className="block">
            <span className="text-xs text-gray-400">Description (min 20 characters)</span>
            <textarea required minLength={20} maxLength={2000} rows={5} className={inputCls} value={form.description} onChange={set("description")} />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs text-gray-400">Category</span>
              <select className={inputCls} value={form.category} onChange={set("category")}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Budget (₹50 – ₹20,000)</span>
              <input required type="number" min={50} max={20000} className={inputCls} value={form.budget} onChange={set("budget")} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">Deadline</span>
              <input required type="date" className={inputCls} value={form.deadline} onChange={set("deadline")} />
            </label>
            <label className="block">
              <span className="text-xs text-gray-400">College (optional, for the campus feed)</span>
              <input className={inputCls} value={form.college} onChange={set("college")} />
            </label>
          </div>
          <TagInput label="Skills needed" values={skills} onChange={setSkills} placeholder="Type a skill and press Enter" />
          <ErrorBox>{error}</ErrorBox>
          <button disabled={saving} className={btnPrimary}>
            {saving ? "Posting..." : "Post task"}
          </button>
        </form>
      </Card>
    </PageShell>
  );
}
