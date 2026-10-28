import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Card, PageShell, ErrorBox, StatusBadge, money, fmtDate, errMsg } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/orders")
      .then((r) => setOrders(r.data.orders))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;
  return (
    <PageShell title="My orders" narrow>
      <ErrorBox>{error}</ErrorBox>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-400">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o._id} to={`/orders/${o._id}`}>
              <Card className="hover:border-[#18c29c] transition flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-semibold">{o.title || o.gig?.title || "Order"}</h3>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {user.role === "client" ? `Freelancer: ${o.student?.name}` : `Client: ${o.client?.name}`}
                    {o.deadline && ` · due ${fmtDate(o.deadline)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span title="Escrow status" className="inline-flex items-center gap-1 text-xs text-gray-400">escrow <StatusBadge status={o.escrow?.status} /></span>
                  <span className="text-white font-semibold">{money(o.price)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
