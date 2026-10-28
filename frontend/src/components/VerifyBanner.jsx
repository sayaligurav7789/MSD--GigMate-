import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Shown to signed-in students/clients until an admin has approved their identity.
export default function VerifyBanner() {
  const { user } = useAuth();
  if (!user || user.role === "admin") return null;
  const status = user.verification?.status || "none";
  if (status === "verified") return null;
  const text =
    status === "pending"
      ? "Your ID is being reviewed by an admin. You can browse in the meantime."
      : status === "rejected"
        ? `Verification was rejected${user.verification?.rejectionReason ? `: ${user.verification.rejectionReason}` : ""}. Please resubmit.`
        : "Verify your account (email OTP + ID proof) to post tasks, send proposals and make payments.";
  return (
    <div className="bg-yellow-900/30 border-b border-yellow-800 text-yellow-200 text-sm">
      <div className="max-w-7xl mx-auto px-6 py-2 flex items-center justify-between gap-3">
        <span>{text}</span>
        {status !== "pending" && (
          <Link to="/verification" className="underline whitespace-nowrap">
            Verify now
          </Link>
        )}
      </div>
    </div>
  );
}
