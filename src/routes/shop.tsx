import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ShoppingCart, Wallet, LogOut } from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";
import { ProductImage } from "@/components/ProductImage";

type Product = { id: string; name: string; description: string | null; price: number; image_url: string | null; category: string };

const ALL = "All";

export default function ShopPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [coupon, setCoupon] = useState("");
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [result, setResult] = useState<{ name: string; data: string; price: number } | null>(null);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/login"); return; }
    const [catalog, { data: prof }] = await Promise.all([
      api.get("/api/catalog/products"),
      supabase.from("profiles").select("wallet_balance").eq("id", session.user.id).single(),
    ]);
    setProducts(catalog.products as Product[]);
    setStock(catalog.stockCounts);
    setBalance(Number(prof?.wallet_balance ?? 0));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useRealtime(["products", "product_logins", "profiles"], load);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(products.map(p => p.category || "Others")))],
    [products]
  );
  const visible = activeCat === ALL ? products : products.filter(p => (p.category || "Others") === activeCat);

  async function handleBuy(p: Product) {
    setBusyId(p.id);
    try {
      const res = await api.post("/api/store/purchase", { productId: p.id, couponCode: coupon.trim() || undefined });
      setResult({ name: res.productName, data: res.loginData, price: res.pricePaid });
      setBalance(res.newBalance);
      toast.success("Purchase complete");
      load();
    } catch (e: any) { toast.error(e.message); }
    setBusyId(null);
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 bg-card border-b border-border/60">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <Link to="/" className="font-display font-bold">KAMZYBOT'S MEDIA</Link>
          <div className="flex items-center gap-3">
            <Link to="/wallet" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-colors">
              <Wallet className="w-4 h-4" /> ₦{balance.toLocaleString()}
            </Link>
            <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6">
        <h1 className="font-display text-2xl font-bold mb-4">Shop</h1>

        <div className="bg-card border border-border/60 rounded-xl p-4 mb-6">
          <label className="block text-xs font-medium mb-1">Coupon code (optional)</label>
          <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} placeholder="GIVEAWAY10" className="w-full sm:w-64 h-10 rounded-lg border border-input bg-background px-3 text-sm uppercase" />
          <p className="text-xs text-muted-foreground mt-1">Applied to your next purchase.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                activeCat === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? <div className="flex justify-center p-12"><Loader2 className="w-6 h-6 animate-spin" /></div> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visible.map(p => {
              const s = stock[p.id] ?? 0;
              const out = s === 0;
              return (
                <div key={p.id} className="bg-card border border-border/60 rounded-xl p-4 flex flex-col">
                  {p.image_url && <ProductImage src={p.image_url} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-3" />}
                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">{p.category || "Others"}</div>
                  <h3 className="font-semibold mb-1">{p.name}</h3>
                  {p.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{p.description}</p>}
                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-lg">₦{Number(p.price).toLocaleString()}</div>
                      <div className={`text-xs ${out ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        {out ? "Out of Stock" : `${s} in stock`}
                      </div>
                    </div>
                    <button disabled={out || busyId === p.id} onClick={() => handleBuy(p)} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
                      {busyId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                      {out ? "Out" : "Buy"}
                    </button>
                  </div>
                </div>
              );
            })}
            {visible.length === 0 && <div className="col-span-full text-center text-muted-foreground py-12">No products in this category yet</div>}
          </div>
        )}
      </main>

      {result && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setResult(null)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold mb-2">✓ {result.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">You paid ₦{result.price.toLocaleString()}. Your login details:</p>
            <pre className="bg-muted rounded-lg p-3 text-sm font-mono whitespace-pre-wrap break-all">{result.data}</pre>
            <p className="text-xs text-muted-foreground mt-3">Save this now. You can also view it again in your order history.</p>
            <button onClick={() => setResult(null)} className="mt-4 w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold">Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
