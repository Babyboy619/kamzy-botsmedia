import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, MessageCircle, KeyRound, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function AdminPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const trimmedEmail = email.trim();
    const signIn = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });

    if (signIn.error || !signIn.data.session) {
      setLoading(false);
      toast.error(signIn.error?.message ?? "Login failed");
      return;
    }

    try {
      await api.post("/api/admin/verify", { accessToken: signIn.data.session.access_token });
    } catch (error: any) {
      await supabase.auth.signOut();
      setLoading(false);
      toast.error(error?.message ?? "This account does not have admin access");
      return;
    }

    setLoading(false);
    toast.success("Welcome, admin");
    navigate("/manage");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container mx-auto max-w-7xl px-6 h-18 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cta-gradient flex items-center justify-center text-primary-foreground font-bold shadow-soft">K</div>
            <span className="font-display font-bold text-xl tracking-tight">
              KAMZYBOT'S <span className="text-gradient">MEDIA</span>
            </span>
          </Link>
          <Link to="/products" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-cta-gradient text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-soft hover:scale-[1.02] transition-transform">
            Shop Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-10 md:py-16">
        <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-border/60 shadow-soft bg-card">
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-cta-gradient flex items-center justify-center text-primary-foreground shadow-soft mb-4">
                <KeyRound className="w-7 h-7" />
              </div>
              <h1 className="font-display text-3xl font-bold">Admin Login</h1>
              <p className="text-muted-foreground text-sm mt-2">Authorized administrators only</p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email <span className="text-destructive">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="admin@example.com" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">Password <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="password" type={showPwd ? "text" : "password"} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-lg bg-cta-gradient text-primary-foreground font-semibold shadow-soft hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Verifying..." : "Login as Admin"}
              </button>

              <p className="text-center text-sm text-muted-foreground">
                Not an admin?{" "}
                <Link to="/login" className="text-primary font-semibold hover:underline">User login</Link>
              </p>
            </form>
          </div>

          <div className="relative hidden md:flex flex-col items-center justify-center text-center p-12 bg-cta-gradient text-primary-foreground">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="font-display text-3xl font-bold mb-3">Admin Portal</h2>
              <p className="opacity-90 max-w-xs mx-auto">
                Restricted access. Manage products, orders, users, and platform settings.
              </p>
            </div>
          </div>
        </div>
      </main>

      <a href="https://wa.me/2348159696814" target="_blank" rel="noreferrer"
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-soft hover:scale-105 transition-transform">
        <MessageCircle className="w-4 h-4" /> Message Us
      </a>
    </div>
  );
}
