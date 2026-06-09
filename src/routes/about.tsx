import { Link } from "react-router-dom";
import {
  ArrowRight, Globe, ShieldCheck, BadgeCheck, Tag, RefreshCw,
  Headphones, Lock, KeyRound, MessageCircle, Sparkles,
} from "lucide-react";

const highlights = [
  "Tools for professional photo and video editing",
  "Working tools, updates, and license keys",
  "Premium VPNs for every region",
  "Custom websites and apps built to order",
  "Trusted by over 1M+ users",
  "Verified social media accounts",
];

const stats = [
  { value: "15", label: "Team members" },
  { value: "23", label: "Winning awards" },
  { value: "32", label: "Completed projects" },
  { value: "546", label: "Happy clients" },
];

const features = [
  { icon: Globe, title: "Global Accounts", desc: "Access accounts and numbers from multiple regions to fit your business, marketing, and verification needs worldwide." },
  { icon: ShieldCheck, title: "Secure Payment", desc: "Shop with confidence through encrypted checkout and trusted payment methods. Your data and transactions stay protected." },
  { icon: BadgeCheck, title: "Verified Accounts Only", desc: "Every account is tested, verified, and fully functional. No recycled, broken, or low-quality accounts." },
  { icon: Tag, title: "Affordable Pricing", desc: "Premium accounts at fair, competitive prices — so you get the best without overspending." },
];

const promises = [
  { n: "01", icon: RefreshCw, title: "Replacement Policy", desc: "We provide replacements for faulty accounts, but only if the issue is on our end and not due to usage." },
  { n: "02", icon: Headphones, title: "Support Service", desc: "Our technical support team is available 24/7 to address any issues or concerns." },
  { n: "03", icon: Lock, title: "Secure Transactions", desc: "Shop confidently, knowing our platform keeps you secure. Your payments are protected for every client." },
  { n: "04", icon: KeyRound, title: "Secure Account Transfer", desc: "Accounts undergo thorough checks using our private program and mobile proxy to ensure 100% validity." },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container mx-auto max-w-7xl px-6 h-18 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cta-gradient flex items-center justify-center text-primary-foreground font-bold shadow-soft">K</div>
            <span className="font-display font-bold text-xl tracking-tight">KAMZYBOT'S <span className="text-gradient">MEDIA</span></span>
          </Link>
          <Link to="/products" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-cta-gradient text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-soft hover:scale-[1.02] transition-transform">
            Shop Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-cta-gradient opacity-90" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_55%)]" />
          <div className="relative container mx-auto max-w-6xl px-6 py-20 md:py-28 text-primary-foreground text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" /> About Us
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold mt-5 leading-tight">
              Your Trusted Store for <br className="hidden md:block" />Verified Digital Accounts
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-base md:text-lg opacity-90">
              At KAMZYBOT'S MEDIA, we make it simple, safe, and reliable to get the accounts and digital tools you need to grow your presence — whether you're a business owner, marketer, or creator.
            </p>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-4">
            {highlights.map((h) => (
              <div key={h} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-5 shadow-soft">
                <BadgeCheck className="w-5 h-5 mt-0.5 text-primary shrink-0" />
                <p className="text-sm md:text-base font-medium">{h}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card border-y border-border/60">
          <div className="container mx-auto max-w-6xl px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-4xl md:text-5xl font-bold text-gradient">{s.value}</div>
                <div className="mt-2 text-sm text-muted-foreground uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold tracking-wider uppercase text-primary">Our Features</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">KAMZYBOT'S MEDIA Has Many Features</h2>
            <p className="text-muted-foreground mt-4">We make buying verified accounts simple, secure, and transparent. Every feature is designed for peace of mind, fast delivery, and real value.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 rounded-xl bg-cta-gradient flex items-center justify-center text-primary-foreground shadow-soft mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                  <p className="text-muted-foreground text-sm mt-2">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-card border-t border-border/60">
          <div className="container mx-auto max-w-6xl px-6 py-16 md:py-20">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-semibold tracking-wider uppercase text-primary">Our Promise</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">Why Customers Trust Us</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {promises.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="relative rounded-2xl border border-border/60 bg-background p-6 shadow-soft">
                    <span className="absolute top-4 right-4 text-xs font-bold text-muted-foreground/60">{p.n}</span>
                    <Icon className="w-8 h-8 text-primary mb-4" />
                    <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                    <p className="text-muted-foreground text-sm mt-2">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="container mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="relative overflow-hidden rounded-3xl bg-cta-gradient p-10 md:p-14 text-primary-foreground text-center shadow-soft">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_80%_30%,white,transparent_50%)]" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-4xl font-bold">Ready to get started?</h2>
              <p className="mt-3 max-w-xl mx-auto opacity-90">Browse our store or talk to our team to find the perfect digital asset for you.</p>
              <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-6 py-3 text-sm font-semibold shadow-soft hover:scale-[1.02] transition-transform">
                  Start Shopping <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/register" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-semibold hover:bg-white/10 transition-colors">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <a href="https://wa.me/2348159696814" target="_blank" rel="noreferrer"
        className="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-3 text-sm font-semibold shadow-soft hover:scale-105 transition-transform">
        <MessageCircle className="w-4 h-4" /> Message Us
      </a>
    </div>
  );
}
