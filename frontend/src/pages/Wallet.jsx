import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Card, PageShell, ErrorBox, NoticeBox, inputCls, btnPrimary, btnGhost, money, fmtDateTime, errMsg } from "../components/ui";
import { useAuth } from "../context/AuthContext";

const LABELS = {
  topup: "Top-up",
  escrow_hold: "Escrow hold",
  escrow_release: "Payment received",
  refund: "Refund",
  withdraw: "Withdrawal",
};

export default function Wallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [tx, setTx] = useState([]);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const r = await api.get("/wallet");
      setBalance(r.data.balance);
      setTx(r.data.transactions);
    } catch (e) {
      setError(errMsg(e));
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function act(kind) {
    setBusy(true);
    setError(null);
    try {
      await api.post(`/wallet/${kind}`, { amount: Number(amount) });
      setAmount("");
      await load();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageShell title="Wallet" subtitle="Escrow-protected payments" narrow>
      <NoticeBox>
        Test mode: money here is simulated. In production this connects to a payment gateway (e.g. Razorpay).
      </NoticeBox>
      <Card className="mt-4">
        <p className="text-xs text-gray-400 uppercase tracking-wide">Available balance</p>
        <p className="text-white text-3xl font-semibold mt-1">{money(balance)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <input type="number" min={10} placeholder="Amount (₹)" className={`${inputCls} max-w-[180px]`} value={amount} onChange={(e) => setAmount(e.target.value)} />
          {user?.role === "client" && (
            <button disabled={busy || !amount} className={btnPrimary} onClick={() => act("topup")}>Add funds</button>
          )}
          {user?.role === "student" && (
            <button disabled={busy || !amount} className={btnGhost} onClick={() => act("withdraw")}>Withdraw</button>
          )}
        </div>
        <div className="mt-3"><ErrorBox>{error}</ErrorBox></div>
      </Card>

      <h2 className="text-white text-xl font-semibold mt-8 mb-3">History</h2>
      {tx.length === 0 && <p className="text-gray-400">No transactions yet.</p>}
      <div className="rounded-xl border border-[#0f3d34] overflow-hidden">
        {tx.map((t) => (
          <div key={t._id} className="flex items-center justify-between px-4 py-3 border-b border-[#0f3d34] last:border-b-0 bg-[#062a23]">
            <div>
              <p className="text-white text-sm">{LABELS[t.type] || t.type}</p>
              <p className="text-xs text-gray-400">{t.note} · {fmtDateTime(t.createdAt)}</p>
            </div>
            <p className={t.amount >= 0 ? "text-emerald-300" : "text-red-300"}>
              {t.amount >= 0 ? "+" : "-"}{money(Math.abs(t.amount))}
            </p>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
