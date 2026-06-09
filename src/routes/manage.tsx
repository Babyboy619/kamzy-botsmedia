import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { api } from "@/lib/api";
import { Loader2, LayoutDashboard, Ticket, Package, Users, ShieldPlus, KeyRound, LogOut, ShoppingCart, CreditCard, Menu, X } from "lucide-react";
import { toast } from "sonner";

const NAV = [
  { to: "/manage", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/manage/orders", label: "Orders", icon: ShoppingCart },
  { to: "/manage/payments", label: "Payments", icon: CreditCard },
  { to: "/manage/products", label: "Products", icon: Package },
  { to: "/manage/coupons", label: "Coupons", icon: Ticket },
  { to: "/manage/users", label: "Users", icon: Users },
  { to: "/manage/admins", label: "Admins", icon: ShieldPlus },
  { to: "/manage/password", label: "Change Password", icon: KeyRound },
];

export default function ManageLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        if (!ignore) navigate("/admin");
        return;
      }
      try {
        await api.post("/api/admin/verify", { accessToken: session.access_token });
      } catch (error) {
        await supabase.auth.signOut();
        toast.error("Admin access required");
        if (!ignore) navigate("/admin");
        return;
      }
      if (!ignore) setChecking(false);
    })();
    return () => { ignore = true; };
  }, [navigate]);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin");
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const NavLinks = () => (
    <>
      {NAV.map(({ to, label, icon: Icon, exact }) => {
        const isActive = exact
          ? location.pathname === to
          : location.pathname.startsWith(to) && to !== "/manage";
        const isExact = to === "/manage" && location.pathname === "/manage";
        const active = isExact || (!exact && isActive);
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" /> {label}
          </Link>
        );
      })}
    </>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 bg-card border-b border-border/60">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border/60 hover:bg-muted transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <Link to="/manage" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cta-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">K</div>
              <span className="font-display font-bold tracking-tight hidden sm:block">Admin Panel</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground hidden sm:block">← Main site</Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" /> <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside className="relative w-72 h-full bg-card shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-border/60 flex items-center justify-between">
              <span className="font-display font-bold">Admin Panel</span>
              <button onClick={() => setSidebarOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-2">
              <NavLinks />
            </nav>
          </aside>
        </div>
      )}

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-6 grid md:grid-cols-[220px_1fr] gap-6">
        <nav className="hidden md:block bg-card rounded-xl border border-border/60 p-2 h-fit md:sticky md:top-20">
          <NavLinks />
        </nav>
        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
