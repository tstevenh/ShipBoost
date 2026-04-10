import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Star, ShieldCheck, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/ui/footer";

const pricingTiers = [
  {
    name: "Free listing",
    price: "$0",
    description:
      "Get your SaaS live in the directory with a clean public profile and category/tag placement.",
    eyebrow: "Start here",
    ctaLabel: "Submit for free",
    ctaHref: "/submit",
    highlight: false,
    icon: ShieldCheck,
    points: [
      "Public tool listing on Shipboost",
      "Category and tag visibility",
      "Founder-managed profile after approval",
      "Good default path for early discovery",
    ],
  },
  {
    name: "Featured launch",
    price: "$9",
    description:
      "Reserve a featured launch slot and push your product into the launch board with priority treatment.",
    eyebrow: "Fastest paid boost",
    ctaLabel: "Book featured launch",
    ctaHref: "/submit",
    highlight: true,
    icon: Star,
    points: [
      "Featured launch placement",
      "Priority launch weighting",
      "Scheduled launch date support",
      "Same submission flow, with checkout",
    ],
  },
  {
    name: "Done-for-you",
    price: "Custom",
    description:
      "Hands-on distribution support for founders who want Shipboost to help push the launch further.",
    eyebrow: "Higher-touch service",
    ctaLabel: "Link coming soon",
    ctaHref: null,
    highlight: false,
    icon: Zap,
    points: [
      "Productized launch support",
      "Founder-facing distribution help",
      "Built for teams that need leverage fast",
      "Service link will be added later",
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Pricing | Shipboost",
  description:
    "Simple launch pricing for bootstrapped SaaS founders: free listing, $9 featured launch, and done-for-you distribution support.",
};

export default function PricingPage() {
  return (
    <main className="flex-1 flex flex-col bg-muted/20 pt-32">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 mb-32">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 uppercase mb-4">
            Pricing
          </p>
          <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl lowercase">
            Simple launch options for serious founders.
          </h1>
          <p className="mt-6 text-xl font-medium leading-relaxed text-muted-foreground/80">
            Start with a free listing, pay for a featured launch when you want a
            stronger push, or let our operators handle your distribution.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={cn(
                "flex h-full flex-col rounded-3xl border p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/5",
                tier.highlight
                  ? "border-primary bg-card ring-4 ring-primary/5 relative scale-[1.02] z-10"
                  : "border-border bg-card shadow-sm"
              )}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-lg shadow-black/20">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40 uppercase">
                  {tier.eyebrow}
                </p>
                <tier.icon size={20} className={cn(tier.highlight ? "text-foreground" : "text-muted-foreground/40")} />
              </div>

              <h2 className="text-2xl font-black text-foreground">
                {tier.name}
              </h2>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter text-foreground">{tier.price}</span>
                {tier.price.startsWith("$") && <span className="text-muted-foreground font-bold text-sm">/launch</span>}
              </div>
              <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
                {tier.description}
              </p>

              <ul className="mt-10 space-y-4 flex-1">
                {tier.points.map((point) => (
                  <li key={point} className="flex items-start gap-3 group">
                    <div className={cn(
                      "mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-colors",
                      tier.highlight ? "bg-foreground/5 text-foreground" : "bg-muted text-muted-foreground/40"
                    )}>
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-bold text-foreground/80 group-hover:text-foreground transition-colors">{point}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10">
                {tier.ctaHref ? (
                  <Link
                    href={tier.ctaHref}
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black transition-all active:scale-95 shadow-xl",
                      tier.highlight
                        ? "bg-primary text-primary-foreground hover:opacity-90 shadow-black/20"
                        : "bg-foreground text-background hover:opacity-90 shadow-black/10"
                    )}
                  >
                    {tier.ctaLabel}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/50 px-6 py-4 text-sm font-black text-muted-foreground/50"
                  >
                    {tier.ctaLabel}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        <section className="mt-20 grid gap-12 lg:grid-cols-[1.2fr_0.8fr] items-start">
          <div className="space-y-6">
            <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40 uppercase">
              Brand Commitment
            </p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Distribution over vanity. Trust first.
            </h2>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              ShipBoost is built for operators, not hype-chasers. We keep our submission 
              flow simple and our directory clean to ensure that when a founder 
              launches here, they're actually building credibility.
            </p>
            <div className="pt-4">
              <Link href="/submit" className="inline-flex items-center gap-2 text-sm font-black text-foreground hover:underline underline-offset-4">
                View submission guidelines <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <h3 className="text-sm font-black tracking-[0.2em] text-foreground uppercase mb-6 flex items-center gap-2">
              <Zap size={16} /> Why boost?
            </h3>
            <div className="space-y-6">
              {[
                { title: "Priority Weighting", desc: "Featured launches stay visible longer and appear higher in the feed." },
                { title: "Founder Claims", desc: "Verified founder tags signal trust to users and potential investors." },
                { title: "Structured Loops", desc: "We push your product through curated distribution channels." }
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <h4 className="text-sm font-black text-foreground">{item.title}</h4>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
