import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Eye, EyeOff, ArrowRight, ShieldCheck, MessageCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function LoginPage() {
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    navigate("/dashboard");
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { toast.error(error.message); setGoogleLoading(false); }
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
          <Link to="/register" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-cta-gradient text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-soft hover:scale-[1.02] transition-transform">
            Register <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-10 md:py-16">
        <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-border/60 shadow-soft bg-card">
          <div className="p-8 md:p-12">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-cta-gradient flex items-center justify-center text-primary-foreground font-bold text-xl shadow-soft mb-4">K</div>
              <h1 className="font-display text-3xl font-bold">Login</h1>
              <p className="text-muted-foreground text-sm mt-2">Log into your account to continue</p>
            </div>

            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full h-11 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium inline-flex items-center justify-center gap-3 disabled:opacity-60 transition-colors mb-5"
            >
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
                </svg>
              )}
              {googleLoading ? "Redirecting…" : "Continue with Google"}
            </button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground mb-5">
              <div className="flex-1 h-px bg-border" /> OR <div className="flex-1 h-px bg-border" />
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">Email <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="you@example.com" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">Password <span className="text-destructive">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input id="password" type={showPwd ? "text" : "password"} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading || googleLoading}
                className="w-full h-12 rounded-lg bg-cta-gradient text-primary-foreground font-semibold shadow-soft hover:scale-[1.01] active:scale-[0.99] transition-transform disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="text-right -mt-2">
                <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">Forgot password?</Link>
              </div>

              <p className="text-center text-sm text-muted-foreground">
                Not registered yet?{" "}
                <Link to="/register" className="text-primary font-semibold hover:underline">Create an account</Link>
              </p>
            </form>
          </div>

          <div className="relative hidden md:flex flex-col items-center justify-center text-center p-12 bg-cta-gradient text-primary-foreground">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mb-6">
                <ShieldCheck className="w-10 h-10" />
              </div>
              <h2 className="font-display text-3xl font-bold mb-3">Secure Access</h2>
              <p className="opacity-90 max-w-xs mx-auto">
                Login to your account and manage your digital assets securely.
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
