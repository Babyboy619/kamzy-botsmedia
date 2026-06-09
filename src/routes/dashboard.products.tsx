import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Eye, EyeOff, Copy, ShoppingBag, ExternalLink, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useRealtime } from "@/hooks/use-realtime";
import { ProductImage } from "@/components/ProductImage";

type Purchase = {
  id: string;
  productId: string;
  product: { id: string; name: string; description: string | null; image_url: string | null; category: string; price: number } | null;
  loginData: string | null;
  pricePaid: number;
  status: string;
  createdAt: string;
  couponCode: string | null;
  discountPercent: number | null;
};

function formatNGN(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MyProductsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    try {
      const res = await api.get("/api/user/purchases");
      setPurchases(res.purchases as Purchase[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load");
    }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useRealtime(["orders", "product_logins"], load);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Copy failed");
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="sticky top-0 z-40 bg-background border-b border-border/60">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <span className="font-display font-bold tracking-tight">My Products</span>
          <Link to="/products" className="text-sm text-primary font-semibold hover:underline">Shop more</Link>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-8">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : purchases.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <h2 className="font-display text-xl font-bold">You have not purchased any products yet.</h2>
            <p className="text-sm text-muted-foreground mt-2">Visit the shop to grab your first one.</p>
            <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-cta-gradient text-primary-foreground px-6 py-3 text-sm font-semibold shadow-soft">
              Browse products <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.map(p => {
              const open = !!revealed[p.id];
              return (
                <div key={p.id} className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col shadow-sm">
                  {p.product?.image_url && (
                    <ProductImage src={p.product.image_url} alt={p.product?.name ?? ""} className="w-full h-32 object-cover rounded-xl mb-3" />
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary">{p.product?.category ?? "Product"}</div>
                      <h3 className="font-semibold truncate">{p.product?.name ?? "Product"}</h3>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-0.5 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" /> {p.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(p.createdAt).toLocaleString()} · {formatNGN(p.pricePaid)}
                  </p>

                  <div className="mt-3 rounded-xl bg-muted p-3">
                    {p.loginData ? (
                      open ? (
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">{p.loginData}</pre>
                      ) : (
                        <p className="text-xs text-muted-foreground">Credentials hidden. Click reveal to view.</p>
                      )
                    ) : (
                      <p className="text-xs text-muted-foreground">No credentials attached.</p>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setRevealed(s => ({ ...s, [p.id]: !s[p.id] }))}
                      disabled={!p.loginData}
                      className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-lg border border-border text-xs font-semibold disabled:opacity-50"
                    >
                      {open ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {open ? "Hide" : "Reveal"}
                    </button>
                    <button
                      onClick={() => p.loginData && copy(p.loginData)}
                      disabled={!p.loginData}
                      className="flex-1 inline-flex items-center justify-center gap-1 h-9 rounded-lg bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
