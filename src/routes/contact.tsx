import { Link } from "react-router-dom";
import { ArrowRight, Mail, MessageCircle, Send, Users, AtSign, LifeBuoy, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";

const CONTACTS = {
  whatsappMessage: "https://wa.me/2348159696814",
  whatsappCommunity: "https://chat.whatsapp.com/EvXxgtIsxPiDsEGFQcMP9v",
  telegramChannel: "https://t.me/kamzybotsmedia01",
  telegramContact: "https://t.me/Kamzybotsmedia",
  email: "kamzybotsmedia@gmail.com",
  emailHref: "mailto:kamzybotsmedia@gmail.com",
  address: "023 Old Poly Quarters, Lokoja, Kogi State, Nigeria",
};

export default function ContactPage() {
  const channels = [
    { name: "Message us on WhatsApp", desc: "Chat directly with our team — fast replies, real humans.", cta: "Open WhatsApp", href: CONTACTS.whatsappMessage, icon: MessageCircle, color: "oklch(0.65 0.18 150)" },
    { name: "WhatsApp Community", desc: "Join our active community for deals, drops & instant support.", cta: "Join community", href: CONTACTS.whatsappCommunity, icon: Users, color: "oklch(0.6 0.18 145)" },
    { name: "Telegram Channel", desc: "Subscribe for the latest stock updates and announcements.", cta: "Open channel", href: CONTACTS.telegramChannel, icon: Send, color: "oklch(0.65 0.16 240)" },
    { name: "Telegram Contact", desc: "Send us a direct message on Telegram for personal support.", cta: "Message on Telegram", href: CONTACTS.telegramContact, icon: AtSign, color: "oklch(0.6 0.16 235)" },
    { name: "Email Us", desc: CONTACTS.email, cta: "Send an email", href: CONTACTS.emailHref, icon: Mail, color: "oklch(0.6 0.2 295)" },
    { name: "Visit / Mail Us", desc: CONTACTS.address, cta: "Get directions", href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACTS.address)}`, icon: LifeBuoy, color: "oklch(0.62 0.17 30)" },
  ];
  const { isAuthed } = useAuth();
  const nav = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
    ...(isAuthed
      ? [{ label: "Dashboard", href: "/dashboard" }]
      : [{ label: "Login", href: "/login" }]),
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="container mx-auto max-w-7xl px-6 h-18 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-cta-gradient flex items-center justify-center text-primary-foreground font-bold shadow-soft">K</div>
            <span className="font-display font-bold text-xl tracking-tight">KAMZYBOT'S <span className="text-gradient">MEDIA</span></span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            {nav.map(i => <Link key={i.label} to={i.href} className="hover:text-foreground transition-colors">{i.label}</Link>)}
          </nav>
          <Sheet>
            <SheetTrigger aria-label="Open menu" className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-xl border border-border/70 bg-card/60 hover:bg-card transition-colors shadow-soft">
              <Menu className="w-6 h-6 text-foreground" />
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:max-w-sm p-0 flex flex-col">
              <SheetHeader className="px-6 py-5 border-b border-border/60 text-left">
                <SheetTitle className="font-display text-xl">KAMZYBOT'S <span className="text-gradient">MEDIA</span></SheetTitle>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto px-2 py-4">
                {nav.map(i => (
                  <Link key={i.label} to={i.href} className="block px-5 py-4 text-lg font-medium text-foreground/90 hover:bg-muted/60 rounded-lg transition-colors">{i.label}</Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <div className="text-sm font-semibold text-primary uppercase tracking-wider">Get in touch</div>
          <h1 className="mt-3 font-display font-bold text-4xl md:text-5xl">Connect with KAMZYBOT'S MEDIA</h1>
          <p className="mt-4 text-muted-foreground">Pick the channel that works best for you — we reply fast.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {channels.map(c => {
            const Icon = c.icon;
            return (
              <a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer"
                className="group rounded-3xl border border-border bg-card p-7 hover:shadow-soft transition-all hover:-translate-y-1">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-soft" style={{ background: c.color }}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="mt-5 font-bold text-xl">{c.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed break-words">{c.desc}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  {c.cta} <ArrowRight className="w-4 h-4" />
                </div>
              </a>
            );
          })}
        </div>
      </main>
    </div>
  );
}
