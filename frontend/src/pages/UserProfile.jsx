import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Card, PageShell, ErrorBox, TrustBadge, VerifiedBadge, NewTalentBadge, Stars, money, fmtDate, errMsg } from "../components/ui";

export default function UserProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [gigs, setGigs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/users/${id}`).then((r) => setUser(r.data.user)),
      api.get("/gigs", { params: { student: id } }).then((r) => setGigs(r.data.gigs)),
      api.get(`/users/${id}/reviews`).then((r) => setReviews(r.data.reviews)),
    ])
      .catch((e) => setError(errMsg(e, "User not found")))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="max-w-5xl mx-auto px-6 py-10 text-gray-400">Loading...</p>;
  if (!user) return <p className="max-w-5xl mx-auto px-6 py-10 text-red-400">{error || "User not found"}</p>;
  const sp = user.studentProfile;
  const cp = user.clientProfile;

  return (
    <PageShell narrow title={user.name} subtitle={user.role === "student" ? "Student freelancer" : "Client"}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <VerifiedBadge user={user} />
        <NewTalentBadge user={user} />
        <TrustBadge user={user} />
        <Stars avg={user.stats?.ratingAvg} count={user.stats?.ratingCount} />
        {user.role === "student" && <span className="text-xs text-gray-400">{user.stats?.completedOrders ?? 0} orders completed</span>}
      </div>
      <ErrorBox>{error}</ErrorBox>

      {user.role === "student" && sp && (
        <Card>
          {sp.college && <p className="text-gray-300"><span className="text-gray-400">College:</span> {sp.college}{sp.degree && ` · ${sp.degree}`}{sp.year && ` · ${sp.year}`}</p>}
          {sp.bio && <p className="text-gray-300 mt-2 whitespace-pre-line">{sp.bio}</p>}
          {sp.skills?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {sp.skills.map((s) => <span key={s} className="text-xs px-2 py-1 rounded-full border border-[#0f3d34] text-gray-300">{s}</span>)}
            </div>
          )}
          {sp.projects?.length > 0 && (
            <div className="mt-4">
              <p className="text-gray-400 text-sm mb-1">College projects</p>
              <ul className="list-disc list-inside text-gray-300 text-sm">{sp.projects.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}
          {sp.portfolioLinks?.length > 0 && (
            <div className="mt-4 space-y-1">
              {sp.portfolioLinks.map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer nofollow" className="block text-[#18c29c] hover:underline text-sm break-all">{u}</a>
              ))}
            </div>
          )}
        </Card>
      )}
      {user.role === "client" && cp && (
        <Card>
          {cp.companyName && <p className="text-white font-semibold">{cp.companyName}</p>}
          {cp.description && <p className="text-gray-300 mt-2 whitespace-pre-line">{cp.description}</p>}
        </Card>
      )}

      {user.role === "student" && (
        <>
          <h2 className="text-white text-xl font-semibold mt-8 mb-3">Gigs</h2>
          {gigs.length === 0 ? (
            <p className="text-gray-400">No gigs yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gigs.map((g) => (
                <Link key={g._id} to={`/gigs/${g._id}`}>
                  <Card className="hover:border-[#18c29c] h-full">
                    <span className="text-xs text-[#18c29c] uppercase">{g.category}</span>
                    <h3 className="text-white font-semibold mt-1 line-clamp-2">{g.title}</h3>
                    <p className="text-white font-semibold mt-3">{money(g.price)}</p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      <h2 className="text-white text-xl font-semibold mt-8 mb-3">Reviews</h2>
      {reviews.length === 0 && <p className="text-gray-400">No reviews yet.</p>}
      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r._id}>
            <p className="text-yellow-300">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
            <p className="text-gray-300 text-sm mt-1">{r.comment || "(no comment)"}</p>
            <p className="text-xs text-gray-500 mt-1">{r.reviewer?.name} · {fmtDate(r.createdAt)}</p>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
