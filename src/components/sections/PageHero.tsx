import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface Breadcrumb {
  name: string;
  href?: string;
}

interface PageHeroProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
}

export function PageHero({ title, subtitle, breadcrumbs }: PageHeroProps) {
  return (
    <section className="w-full bg-hero-glow border-b border-border py-12 md:py-16">
      <div className="container mx-auto max-w-7xl px-6">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
            <Link to="/" className="hover:text-foreground inline-flex items-center gap-1">
              <Home className="w-3.5 h-3.5" /> Home
            </Link>
            {breadcrumbs.map((b) => (
              <span key={b.name} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5" />
                {b.href ? (
                  <Link to={b.href} className="hover:text-foreground">{b.name}</Link>
                ) : (
                  <span className="text-foreground font-medium">{b.name}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="font-display font-bold text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-muted-foreground text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}
