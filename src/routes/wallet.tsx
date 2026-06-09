import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Wallet as WalletIcon, ArrowLeft, Loader2,
  ArrowDownCircle, ArrowUpCircle, ShieldCheck, CreditCard,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useRealtime } from "@/hooks/use-realtime";

type Txn = { id: string; amount: number; type: string; note: string | null; created_at: string };

function formatNGN(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const AMOUNTS = [500, 1000, 2000, 5000, 10000, 20000];

export default function WalletPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const ref = searchParams.get("ref") ?? undefined;
  const provider = searchParams.get("provider") ?? undefined;

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [email, setEmail] = useState<string | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [amount, setAmount] = useState("1000");
  const [coupon, setCoupon] = useState("");
  const [paying, setPaying] = useState<"paystack" | "monnify" | null>(null);
  const [verifyState, setVerifyState] = useState<"idle" | "verifying" | "done">("idle");

  async function refresh() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const [{ data: profile }, { data: txData }] = await Promise.all([
      supabase.from("profiles").select("wallet_balance").eq("id", session.user.id).maybeSingle(),
      supabase.from("wallet_transactions").select("id,amount,type,note,created_at")
        .eq("user_id", session.user.id).order("created_at", { ascending: false }).limit(50),
    ]);
    setBalance(Number(profile?.wallet_balance ?? 0));
    setTxns((txData ?? []) as Txn[]);
  }

  useRealtime(["profiles", "wallet_transactions", "payment_transactions"], refresh);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      setEmail(session.user.email ?? null);
      await refresh();
      if (cancelled) return;
      setLoading(false);

      if (ref) {
        setVerifyState("verifying");
        try {
          const res = await api.post("/api/payments/verify", { reference: ref, provider });
          if (res.ok && res.status === "success") {
            toast.success(`Wallet credited with ${formatNGN(res.amountCredited)} 🎉`);
            await refresh();
          } else {
            toast.error("Payment not confirmed. If you paid, check back in a moment.");
          }
        } catch (e: any) {
          toast.error(e?.message ?? "Verification failed");
        }
        setVerifyState("done");
        setSearchParams({});
      }
    })();
    return () => { cancelled = true; };
  }, [ref]);

  async function pay(provider: "paystack" | "monnify") {
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt < 100) { toast.error("Minimum funding is ₦100"); return; }
    if (amt > 1_000_000) { toast.error("Maximum funding is ₦1,000,000"); return; }
    setPaying(provider);
    try {
      if (provider === "paystack") {
        const res = await api.post("/api/payments/init-paystack", { amount: amt, couponCode: coupon.trim() || undefined });
        window.location.assign(res.authorization_url);
      } else {
        const res = await api.post("/api/payments/init-monnify", { amount: amt, couponCode: coupon.trim() || undefined });
        window.location.assign(res.checkout_url);
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to start payment");
      setPaying(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="sticky top-0 z-40 bg-background border-b border-border/60">
        <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="font-display font-bold tracking-tight">Wallet</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-4 py-8 space-y-6">
        {verifyState === "verifying" && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-sm text-primary inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying your payment…
          </div>
        )}

        <section className="rounded-3xl bg-cta-gradient text-primary-foreground p-7 shadow-soft">
          <div className="flex items-center gap-3 opacity-90 mb-3">
            <WalletIcon className="w-5 h-5" />
            <p className="text-sm">Wallet balance</p>
          </div>
          <p className="font-display text-4xl md:text-5xl font-extrabold tracking-tight">{formatNGN(balance)}</p>
          <p className="mt-2 text-sm opacity-80">{email}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/dashboard/products" className="inline-flex items-center gap-2 rounded-full bg-white text-foreground px-5 py-2.5 text-sm font-semibold shadow-soft hover:scale-[1.02] transition-transform">
              My Products
            </Link>
            <Link to="/products" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10 transition-colors">
              Shop Now
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Fund your wallet</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pay securely with Paystack (card/transfer) or Monnify (USSD/bank transfer/card). Credited instantly.
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Quick select</p>
            <div className="flex flex-wrap gap-2">
              {AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${amount === String(a) ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  ₦{a.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Amount (₦)</span>
              <input type="number" min={100} max={1_000_000} step={50} value={amount}
                onChange={e => setAmount(e.target.value)}
                className="mt-1 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Coupon code (optional)</span>
              <input type="text" value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                placeholder="e.g. GIFT10"
                className="mt-1 w-full h-11 rounded-lg border border-input bg-background px-3 text-sm uppercase" />
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              disabled={!!paying}
              onClick={() => pay("paystack")}
              className="inline-flex items-center justify-center gap-2 h-13 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 hover:scale-[1.02] active:scale-[0.99] shadow-sm"
              style={{ background: "#0BA4DB", color: "#fff" }}
            >
              {paying === "paystack" ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-5 h-5" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 8C0 3.58 3.58 0 8 0h104c4.42 0 8 3.58 8 8v24c0 4.42-3.58 8-8 8H8c-4.42 0-8-3.58-8-8V8z" fill="#0BA4DB"/>
                  <text x="60" y="26" textAnchor="middle" fill="white" fontFamily="Arial" fontWeight="bold" fontSize="16">Paystack</text>
                </svg>
              )}
              {paying === "paystack" ? "Opening Paystack…" : "Pay with Paystack"}
            </button>

            <button
              disabled={!!paying}
              onClick={() => pay("monnify")}
              className="inline-flex items-center justify-center gap-2 h-13 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 hover:scale-[1.02] active:scale-[0.99] shadow-sm"
              style={{ background: "#1A1A2E", color: "#fff" }}
            >
              {paying === "monnify" ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {paying === "monnify" ? "Opening Monnify…" : "Pay with Monnify"}
            </button>
          </div>

          <p className="text-xs text-muted-foreground">Min ₦100 · Max ₦1,000,000 per transaction · Wallet credited instantly on success.</p>
        </section>

        <section>
          <h2 className="font-display font-bold text-xl mb-4">Recent transactions</h2>
          {txns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
              No transactions yet — fund your wallet to get started.
            </div>
          ) : (
            <ul className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
              {txns.map(t => {
                const credit = t.type !== "purchase";
                const Icon = credit ? ArrowDownCircle : ArrowUpCircle;
                return (
                  <li key={t.id} className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${credit ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold capitalize">{t.type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground truncate">{t.note || new Date(t.created_at).toLocaleString()}</p>
                    </div>
                    <p className={`text-sm font-bold shrink-0 ${credit ? "text-foreground" : "text-destructive"}`}>
                      {credit ? "+" : "−"}{formatNGN(Math.abs(Number(t.amount)))}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
