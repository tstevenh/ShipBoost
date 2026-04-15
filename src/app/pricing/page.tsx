import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Star, ShieldCheck, Zap } from "lucide-react";
import {
  premiumLaunchAvailable,
  premiumLaunchUnavailableMessage,
} from "@/lib/premium-launch";
import { cn } from "@/lib/utils";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Footer } from "@/components/ui/footer";
import { getRemainingFoundingPremiumLaunchSpots } from "@/server/services/founding-offer-service";
import { getPremiumLaunchPriceCard } from "@/server/services/dodo-product-service";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildPricingPageSchema } from "@/server/seo/page-schema";

const doneForYouTier = {
  name: "Done-for-you Submission",
  price: "From $99",
  ctaLabel: "See partner plans",
  ctaHref: "https://www.aidirectori.es/?via=ShipBoost",
};

export function generateMetadata(): Metadata {
  const isPrelaunch = getEnv().NEXT_PUBLIC_PRELAUNCH_MODE === "true";
  const description = isPrelaunch
    ? "Compare ShipBoost pricing for Free Launch, Premium Launch, and done-for-you directory submission support before the opening cohort."
    : "Compare ShipBoost pricing for Free Launch, Premium Launch, and done-for-you directory submission support.";

  return buildPublicPageMetadata({
    title: "ShipBoost Pricing | Free and Premium Launches",
    description,
    url: "/pricing",
  });
}

export const revalidate = 900;

export default async function PricingPage() {
  const env = getEnv();
  const isPrelaunch = env.NEXT_PUBLIC_PRELAUNCH_MODE === "true";
  const [foundingSpotsLeft, foundingPremiumPrice] = await Promise.all([
    getRemainingFoundingPremiumLaunchSpots(),
    getPremiumLaunchPriceCard(),
  ]);
  const pricingTiers = [
    {
      name: "Free Launch",
      price: "$0",
      description:
        "Get into the weekly launchpad with a public listing, category placement, and a founder-managed profile after approval.",
      eyebrow: "Weekly launchpad",
      ctaLabel: "Reserve free launch",
      ctaHref: "/submit",
      highlight: false,
      icon: ShieldCheck,
      points: [
        "Weekly launchpad placement",
        "Public tool listing on ShipBoost",
        "Founder-managed profile after approval",
        "Requires badge verification",
      ],
    },
    {
      name: "Premium Launch",
      price: foundingPremiumPrice.currentPrice,
      originalPrice: foundingPremiumPrice.compareAtPrice,
      description:
        "Choose your launch week, skip badge verification, and get priority placement in the weekly launchpad.",
      eyebrow: "Founding offer",
      foundingSpotsLabel: "First 100 Premium Launches",
      ctaLabel: premiumLaunchAvailable
        ? "Reserve premium launch"
        : "Temporarily unavailable",
      ctaHref: premiumLaunchAvailable ? "/submit" : undefined,
      availabilityNote: premiumLaunchAvailable
        ? undefined
        : premiumLaunchUnavailableMessage,
      highlight: true,
      icon: Star,
      points: [
        "Choose your launch week",
        "Premium placement in the weekly launchpad",
        "No badge required",
        "Priority ordering over free launches",
      ],
    },
    {
      name: doneForYouTier.name,
      price: doneForYouTier.price,
      description:
        "Handled by AI Directories: manual submission packages for 30+, 60+, or 100+ AI directories with a detailed report after delivery.",
      eyebrow: "Partner offer",
      ctaLabel: doneForYouTier.ctaLabel,
      ctaHref: doneForYouTier.ctaHref,
      highlight: false,
      icon: Zap,
      points: [
        "Starter from $99 for 30+ AI directories",
        "Pro from $149 for 60+ directories",
        "Premium from $199 for 100+ directories",
        "Detailed submission report",
      ],
    },
  ] as const;
  const schema = buildPricingPageSchema({
    title: "Pricing",
    description: isPrelaunch
      ? "Pricing for founders who want trust, visibility, and real distribution. Start free, reserve a Premium Launch for the May 1 opening cohort, or use our AI Directories partner service."
      : "Pricing for founders who want trust, visibility, and real distribution. Start free, reserve a Premium Launch, or use our AI Directories partner service.",
    url: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return (
    <main className="flex-1 flex flex-col bg-muted/20 pt-32">
      <JsonLdScript data={schema} />
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 mb-32">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40  mb-4">
            Pricing
          </p>
          <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl ">
            {isPrelaunch
              ? "Launch pricing for the opening cohort."
              : "Launch pricing for serious founders."}
          </h1>
          <p className="mt-6 text-xl font-medium leading-relaxed text-muted-foreground/80">
            {isPrelaunch
              ? "ShipBoost opens on May 1, 2026 UTC. Start with a free weekly launch, reserve a Premium Launch week, or hand off directory submissions to our AI Directories partner."
              : "Start with a free weekly launch, reserve a Premium Launch when you want stronger placement, or hand off directory submissions to our AI Directories partner."}
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
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] font-black  tracking-widest whitespace-nowrap shadow-lg shadow-black/20">
                  Founding offer
                </div>
              )}
              
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40 ">
                  {tier.eyebrow}
                </p>
                <tier.icon size={20} className={cn(tier.highlight ? "text-foreground" : "text-muted-foreground/40")} />
              </div>

              <h2 className="text-2xl font-black text-foreground">
                {tier.name}
              </h2>
              <div className="mt-4 flex items-end gap-3">
                {"originalPrice" in tier && tier.originalPrice ? (
                  <span className="text-lg font-black text-muted-foreground line-through">
                    {tier.originalPrice}
                  </span>
                ) : null}
                <span className="text-5xl font-black tracking-tighter text-foreground">
                  {tier.price}
                </span>
                {tier.price.startsWith("$") && (
                  <span className="text-muted-foreground font-bold text-sm">/launch</span>
                )}
              </div>
              {"foundingSpotsLabel" in tier && tier.foundingSpotsLabel ? (
                <p className="mt-2 text-[10px] font-black  tracking-widest text-primary">
                  {foundingSpotsLeft} of 100 founding spots left
                </p>
              ) : null}
              <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
                {tier.description}
              </p>
              {"availabilityNote" in tier && tier.availabilityNote ? (
                <p className="mt-3 text-xs font-bold leading-relaxed text-amber-700">
                  {tier.availabilityNote}
                </p>
              ) : null}

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
            <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40 ">
              Brand Commitment
            </p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Distribution over vanity. Trust first.
            </h2>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              ShipBoost is built for operators. The goal is simple: help founders
              earn trust, get discovered, and turn launch into momentum.
            </p>
            <div className="pt-4">
              <Link href="/submit" className="inline-flex items-center gap-2 text-sm font-black text-foreground hover:underline underline-offset-4">
                View submission guidelines <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
            <h3 className="text-sm font-black tracking-[0.2em] text-foreground  mb-6 flex items-center gap-2">
              <Zap size={16} /> Why ShipBoost
            </h3>
            <div className="space-y-6">
              {[
                { title: "Weekly launchpad", desc: "Weekly cohorts keep launches readable instead of burying them in a crowded daily feed." },
                { title: "Premium priority", desc: "Premium launches reserve a week and start ahead of free launches outside the top vote slots." },
                { title: "Founder ownership", desc: "Founder claims and clean profiles make listings easier to trust." },
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
