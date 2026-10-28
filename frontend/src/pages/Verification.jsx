import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, PageShell, ErrorBox, NoticeBox, StatusBadge, inputCls, btnPrimary, errMsg } from "../components/ui";
import { useAuth } from "../context/AuthContext";

// Three steps: email OTP -> ID proof -> admin approval.
export default function Verification() {
  const { user, refresh } = useAuth();
  const [v, setV] = useState(null);
  const [email, setEmail] = useState(user?.email || "");
  const [otp, setOtp] = useState("");
  const [idProofUrl, setIdProofUrl] = useState("");
  const [idNote, setIdNote] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const r = await api.get("/verification");
    setV(r.data.verification);
    if (r.data.verification.collegeEmail) setEmail(r.data.verification.collegeEmail);
  }
  useEffect(() => {
    load().catch((e) => setError(errMsg(e)));
  }, []);

  async function step(fn) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const r = await fn();
      setNotice(r.data.devOtp ? `${r.data.message} (dev mode OTP: ${r.data.devOtp})` : r.data.message);
      await load();
      await refresh();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  if (!v) return <p className="max-w-3xl mx-auto px-6 py-10 text-gray-400">{error || "Loading..."}</p>;
  const isStudent = user.role === "student";

  return (
    <PageShell title="Verify your account" subtitle="Verified users build trust and unlock posting, proposals and payments" narrow>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-gray-400 text-sm">Status:</span>
        <StatusBadge status={v.status} />
        {v.status === "rejected" && v.rejectionReason && <span className="text-red-300 text-sm">{v.rejectionReason}</span>}
      </div>
      <div className="space-y-4">
        <ErrorBox>{error}</ErrorBox>
        <NoticeBox>{notice}</NoticeBox>

        <Card>
          <h2 className="text-white font-semibold">1. Confirm your email {v.emailVerified && "✓"}</h2>
          <p className="text-gray-400 text-sm mt-1">
            {isStudent ? "Use your college email (e.g. name@college.ac.in)." : "Use an email you check regularly."}
          </p>
          {!v.emailVerified && (
            <div className="mt-3 space-y-3">
              <div className="flex gap-2">
                <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                <button disabled={busy} className={btnPrimary} onClick={() => step(() => api.post("/verification/send-otp", { email }))}>
                  Send OTP
                </button>
              </div>
              <div className="flex gap-2">
                <input className={inputCls} inputMode="numeric" maxLength={6} placeholder="6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} />
                <button disabled={busy || otp.length !== 6} className={btnPrimary} onClick={() => step(() => api.post("/verification/verify-otp", { otp }))}>
                  Verify
                </button>
              </div>
            </div>
          )}
        </Card>

        {v.emailVerified && v.status !== "verified" && (
          <Card>
            <h2 className="text-white font-semibold">2. Submit ID proof</h2>
            <p className="text-gray-400 text-sm mt-1">
              {isStudent
                ? "Link to a photo of your student ID card (Google Drive / Imgur link with view access)."
                : "Link to a photo of a government ID, college club letter, or business registration."}
            </p>
            {v.status === "pending" ? (
              <p className="mt-3 text-yellow-300 text-sm">Submitted. An admin will review it shortly.</p>
            ) : (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  step(() => api.post("/verification/submit-id", { idProofUrl, idNote }));
                }}
              >
                <input required type="url" className={inputCls} placeholder="https://..." value={idProofUrl} onChange={(e) => setIdProofUrl(e.target.value)} />
                <input className={inputCls} placeholder="Note for the admin (optional)" value={idNote} onChange={(e) => setIdNote(e.target.value)} />
                <button disabled={busy} className={btnPrimary}>Submit for review</button>
              </form>
            )}
          </Card>
        )}

        {v.status === "verified" && <NoticeBox>You are verified. You can now post, apply and transact.</NoticeBox>}
      </div>
    </PageShell>
  );
}
