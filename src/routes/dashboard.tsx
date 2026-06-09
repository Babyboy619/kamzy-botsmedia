import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, LogOut, Wallet, Search, ShoppingCart, Package,
  User, Home, Phone, LayoutDashboard, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRealtime } from "@/hooks/use-realtime";
import { ProductImage } from "@/components/ProductImage";
import { api } from "@/lib/api";

type Profile = {
  first_name: string | null; last_name: string | null; username: string | null;
  email: string | null; wallet_balance: number;
};

type Product = {
  id: string; name: string; description: string | null;
  price: number; image_url: string | null; category: string; active: boolean;
};

function formatNGN(n: number) {
  return "₦" + Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCat, setActiveCat] = useState("All");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function loadProfile(userId: string) {
    const { data } = await supabase
      .from("profiles")
      .select("first_name,last_name,username,email,wallet_balance")
      .eq("id", userId)
      .maybeSingle();
    return data;
  }

  async function loadProducts() {
    const res = await api.get("/api/catalog/products");
    setProducts(res.products as Product[]);
    setStock(res.stockCounts);
    const cats = Array.from(new Set<string>((res.products ?? []).map((p: any) => String(p.category || "Others"))));
    setCategories(cats);
  }

  async function refresh() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const p = await loadProfile(session.user.id);
    if (p) setProfile(p as Profile);
    else setProfile({ first_name: null, last_name: null, username: null, email: session.user.email ?? null, wallet_balance: 0 });
    await loadProducts();
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate("/login");
    });
    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  useRealtime(["profiles", "products", "product_logins"], refresh);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Logged out");
    navigate("/");
  }

  const displayName = profile?.first_name || profile?.username || profile?.email?.split("@")[0] || "User";

  const visible = products.filter(p => {
    const matchesCat = activeCat === "All" || (p.category || "Others") === activeCat;
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || "").toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const navLinks = [
    { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
    { label: "My Products", to: "/dashboard/products", icon: Package },
    { label: "Wallet", to: "/wallet", icon: Wallet },
    { label: "Shop", to: "/products", icon: ShoppingCart },
    { label: "Contact", to: "/contact", icon: Phone },
    { label: "Home", to: "/", icon: Home },
  ];

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="sticky top-0 z-40 bg-background border-b border-border/60 shadow-sm">
        <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border/70 bg-card hover:bg-muted transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="font-display font-extrabold text-xl tracking-tight text-primary">
              KAMZY<span className="text-gradient">BOT</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link to="/wallet" className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1.5 text-sm font-semibold border border-primary/20 hover:bg-primary/20 transition-colors">
              <Wallet className="w-3.5 h-3.5" />
              {loading ? "…" : formatNGN(profile?.wallet_balance ?? 0)}
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="relative w-[82vw] max-w-xs h-full bg-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 bg-cta-gradient text-primary-foreground">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{displayName}</p>
                    <p className="text-xs opacity-80 truncate">{profile?.email}</p>
                  </div>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="rounded-xl bg-white/15 backdrop-blur px-3 py-2 text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span>Wallet</span>
                <span className="font-bold ml-auto">{formatNGN(profile?.wallet_balance ?? 0)}</span>
              </div>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              {navLinks.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} to={item.to} onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-5 py-3.5 text-base font-medium hover:bg-muted transition-colors border-b border-border/40">
                    <Icon className="w-5 h-5 text-primary" /> {item.label}
                  </Link>
                );
              })}
              <button onClick={handleLogout}
                className="w-full text-left flex items-center gap-3 px-5 py-3.5 text-base font-medium text-destructive hover:bg-destructive/10 transition-colors border-b border-border/40">
                <LogOut className="w-5 h-5" /> Logout
              </button>
            </nav>
          </aside>
        </div>
      )}

      <main className="container mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h1 className="font-display font-extrabold text-3xl md:text-4xl text-primary tracking-tight">
            Service Marketplace
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Welcome back, <span className="font-semibold text-foreground">{displayName}</span> — browse premium digital assets below.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full h-11 rounded-xl border border-border bg-card pl-10 pr-4 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Link to="/dashboard/products"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm shrink-0">
            <Package className="w-4 h-4" /> My Products
          </Link>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-6">
            {["All", ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                className={`shrink-0 inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                  activeCat === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card h-64 animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-bold">No products found</h2>
            <p className="text-muted-foreground text-sm mt-2">
              {search ? `No results for "${search}"` : "No products in this category yet."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map(p => (
              <ProductCard key={p.id} product={p} stock={stock[p.id] ?? 0} />
            ))}
          </div>
        )}
      </main>

      <a
        href="https://wa.me/2348159696814"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-4 py-3 text-sm font-semibold shadow-soft hover:scale-105 transition-transform z-30"
      >
        <Phone className="w-4 h-4" /> Chat
      </a>
    </div>
  );
}

function ProductCard({ product, stock }: { product: Product; stock: number }) {
  const inStock = stock > 0;
  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col hover:shadow-soft hover:-translate-y-0.5 transition-all">
      <div className="aspect-[4/3] flex items-center justify-center relative bg-muted/40">
        {product.image_url ? (
          <ProductImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-soft bg-cta-gradient">
            <Package className="w-8 h-8" />
          </div>
        )}
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${inStock ? "bg-green-500/15 text-green-700" : "bg-destructive/15 text-destructive"}`}>
          {inStock ? `${stock} in stock` : "Out of stock"}
        </span>
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-card/90 text-primary">
          {product.category || "Others"}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-snug line-clamp-2 flex-1">{product.name}</h3>
        {product.description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="font-display font-bold text-base text-gradient">
            ₦{Number(product.price).toLocaleString()}
          </div>
          {inStock ? (
            <Link
              to="/shop"
              className="rounded-full px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 bg-cta-gradient text-primary-foreground shadow-soft hover:scale-105 transition-transform"
            >
              Buy <ShoppingCart className="w-3 h-3" />
            </Link>
          ) : (
            <span className="rounded-full px-3 py-1.5 text-xs font-semibold bg-muted text-muted-foreground">
              Sold out
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
