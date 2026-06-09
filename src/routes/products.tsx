import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageCircle, Send, LifeBuoy, ShoppingCart, Package, Sparkles, Menu, Loader2,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth, signOut } from "@/hooks/use-auth";
import { useRealtime } from "@/hooks/use-realtime";
import { ProductImage } from "@/components/ProductImage";
import { api } from "@/lib/api";

const CONTACTS = {
  whatsapp: "https://wa.me/2348159696814",
  telegram: "https://t.me/Kamzybotsmedia",
  support: "mailto:kamzybotsmedia@gmail.com",
};

const ALL = "All";

type Product = {
  id: string; name: string; description: string | null;
  price: number; image_url: string | null; category: string;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [stock, setStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string>(ALL);

  async function load() {
    const res = await api.get("/api/catalog/products");
    setProducts(res.products as Product[]);
    setStock(res.stockCounts);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);
  useRealtime(["products", "product_logins"], load);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(products.map(p => p.category || "Others")))],
    [products]
  );
  const visible = activeCat === ALL ? products : products.filter(p => (p.category || "Others") === activeCat);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero count={products.length} />
      <CategoryNav categories={categories} active={activeCat} onChange={setActiveCat} />
      <main className="container mx-auto max-w-7xl px-6 pb-24 pt-8">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div>
        ) : visible.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-display text-xl font-bold">No products yet</h2>
            <p className="mt-2 text-muted-foreground text-sm">
              {activeCat === ALL
                ? "Our admins haven't uploaded any products yet. Check back soon."
                : `No products listed under "${activeCat}" right now.`}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visible.map(p => <ProductCard key={p.id} product={p} stock={stock[p.id] ?? 0} />)}
          </div>
        )}
      </main>
      <CTA />
      <Footer />
      <FloatingContact />
    </div>
  );
}

function Header() {
  const { isAuthed } = useAuth();
  const navItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    ...(isAuthed
      ? [{ label: "Dashboard", href: "/dashboard" }, { label: "Wallet", href: "/wallet" }]
      : [{ label: "Login", href: "/login" }, { label: "Register", href: "/register" }]),
  ];
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
      <div className="container mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-cta-gradient flex items-center justify-center text-primary-foreground font-bold shadow-soft">K</div>
          <span className="font-display font-bold text-xl tracking-tight">KAMZYBOT'S <span className="text-gradient">MEDIA</span></span>
        </Link>
        <Sheet>
          <SheetTrigger aria-label="Open menu" className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-border/70 bg-card/60 hover:bg-card transition-colors shadow-soft">
            <Menu className="w-6 h-6 text-foreground" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] sm:max-w-sm p-0 flex flex-col">
            <SheetHeader className="px-6 py-5 border-b border-border/60 text-left">
              <SheetTitle className="font-display text-xl">KAMZYBOT'S <span className="text-gradient">MEDIA</span></SheetTitle>
            </SheetHeader>
            <nav className="flex-1 overflow-y-auto px-2 py-4">
              {navItems.map(i => (
                <Link key={i.label} to={i.href} className="block px-5 py-4 text-lg font-medium text-foreground/90 hover:bg-muted/60 rounded-lg transition-colors">
                  {i.label}
                </Link>
              ))}
              {isAuthed && (
                <button onClick={() => signOut().then(() => window.location.reload())} className="w-full text-left block px-5 py-4 text-lg font-medium text-destructive hover:bg-muted/60 rounded-lg transition-colors">
                  Logout
                </button>
              )}
            </nav>
            <div className="p-5 border-t border-border/60">
              <a href={CONTACTS.whatsapp} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full rounded-full bg-cta-gradient text-primary-foreground px-6 py-3.5 text-base font-semibold shadow-soft hover:scale-[1.02] transition-transform">
                Order Now
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function PageHero({ count }: { count: number }) {
  return (
    <section className="relative overflow-hidden bg-hero-glow border-b border-border/60">
      <div className="container mx-auto max-w-7xl px-6 py-16 md:py-20">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-card">
          <Package className="w-3.5 h-3.5 text-primary" /> SERVICE MARKETPLACE
        </div>
        <h1 className="mt-6 font-display font-extrabold text-5xl md:text-6xl leading-[1.05] max-w-3xl">
          All <span className="text-gradient">products & services</span> in one place.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Browse every category — Facebook, Instagram, TikTok, Telegram, Netflix, Spotify and more.
          Buy instantly with your wallet — login is delivered immediately.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-sm">
            <ShoppingCart className="w-4 h-4 text-primary" /> {count} live products
          </span>
          <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-cta-gradient text-primary-foreground px-5 py-2 text-sm font-semibold shadow-soft hover:scale-[1.02] transition-transform">
            <Sparkles className="w-4 h-4" /> Go to Shop
          </Link>
        </div>
      </div>
    </section>
  );
}

function CategoryNav({ categories, active, onChange }: { categories: string[]; active: string; onChange: (c: string) => void }) {
  return (
    <div className="sticky top-[73px] z-30 bg-background/90 backdrop-blur border-b border-border/60">
      <div className="container mx-auto max-w-7xl px-6 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
              active === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, stock }: { product: Product; stock: number }) {
  const inStock = stock > 0;
  return (
    <div className="group rounded-3xl border border-border bg-card overflow-hidden flex flex-col hover:shadow-soft hover:-translate-y-1 transition-all">
      <div className="aspect-[4/3] flex items-center justify-center relative bg-muted/40">
        {product.image_url ? (
          <ProductImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white shadow-soft bg-cta-gradient">
            <Package className="w-10 h-10" />
          </div>
        )}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${inStock ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-destructive/15 text-destructive"}`}>
          {inStock ? `In Stock: ${stock}` : "Out of Stock"}
        </span>
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-card/90 text-primary">
          {product.category || "Others"}
        </span>
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-bold text-sm leading-snug line-clamp-2">{product.name}</h3>
        {product.description && <p className="mt-2 text-xs text-muted-foreground line-clamp-3 flex-1">{product.description}</p>}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</div>
            <div className="font-display font-bold text-lg text-gradient">₦{Number(product.price).toLocaleString()}</div>
          </div>
          {inStock ? (
            <Link to="/shop" className="rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 transition-transform bg-cta-gradient text-primary-foreground shadow-soft group-hover:scale-105">
              Buy <ShoppingCart className="w-3 h-3" />
            </Link>
          ) : (
            <span className="rounded-full px-4 py-2 text-xs font-semibold inline-flex items-center gap-1.5 bg-muted text-muted-foreground opacity-70">
              Out <ShoppingCart className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function CTA() {
  return (
    <section className="container mx-auto max-w-7xl px-6 pb-24">
      <div className="rounded-3xl bg-cta-gradient text-primary-foreground p-10 md:p-14 text-center shadow-soft">
        <h2 className="font-display font-bold text-3xl md:text-4xl">Can't find what you need?</h2>
        <p className="mt-3 max-w-xl mx-auto opacity-90">We stock dozens more services off-listing. Message support and we'll source it for you.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href={CONTACTS.whatsapp} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white text-primary px-6 py-3 font-semibold inline-flex items-center gap-2 hover:scale-105 transition-transform">
            <MessageCircle className="w-4 h-4" /> WhatsApp us
          </a>
          <a href={CONTACTS.telegram} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 backdrop-blur border border-white/30 px-6 py-3 font-semibold inline-flex items-center gap-2 hover:bg-white/20 transition-colors">
            <Send className="w-4 h-4" /> Telegram
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container mx-auto max-w-7xl px-6 py-10 flex flex-col sm:flex-row gap-3 justify-between items-center text-sm text-muted-foreground">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cta-gradient flex items-center justify-center text-primary-foreground text-xs font-bold">K</div>
          <span className="font-display font-bold">KAMZYBOT'S <span className="text-gradient">MEDIA</span></span>
        </Link>
        <div>© {new Date().getFullYear()} KAMZYBOT'S MEDIA. All rights reserved.</div>
      </div>
    </footer>
  );
}

function FloatingContact() {
  const items = [
    { href: CONTACTS.whatsapp, icon: MessageCircle, label: "WhatsApp", bg: "oklch(0.65 0.18 150)" },
    { href: CONTACTS.telegram, icon: Send, label: "Telegram", bg: "oklch(0.65 0.16 240)" },
    { href: CONTACTS.support, icon: LifeBuoy, label: "Support", bg: "oklch(0.6 0.2 295)" },
  ];
  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col gap-3">
      {items.map(i => {
        const Icon = i.icon;
        return (
          <a key={i.label} href={i.href} target="_blank" rel="noopener noreferrer" aria-label={i.label} className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-soft hover:scale-110 transition-transform" style={{ background: i.bg }}>
            <Icon className="w-5 h-5" />
          </a>
        );
      })}
    </div>
  );
}
