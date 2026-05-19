import type { Metadata } from "next";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Megaphone,
  MousePointerClick,
  Star,
  ShieldCheck,
  Zap,
  Layout,
  Newspaper,
  Package,
} from "lucide-react";
import {
  premiumLaunchAvailable,
  premiumLaunchUnavailableMessage,
} from "@/lib/premium-launch";
import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";
import { cn } from "@/lib/utils";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Footer } from "@/components/ui/footer";
import { AdPreviewButton } from "@/components/public/ad-preview-modal";
import { getRemainingFoundingPremiumLaunchSpots } from "@/server/services/founding-offer-service";
import { getPremiumLaunchPriceCard } from "@/server/services/dodo-product-service";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildPricingPageSchema } from "@/server/seo/page-schema";

export function generateMetadata(): Metadata {
  const isPrelaunch = getEnv().NEXT_PUBLIC_PRELAUNCH_MODE === "true";
  const description = isPrelaunch
    ? "Launch your product and stay visible. Compare Free Launch, Premium Launch with editorial spotlight, and ShipBoost's partner submission support."
    : "Launch your product and stay visible. Free Launch for launch-day exposure, Premium Launch with an editorial spotlight that keeps working long after.";

  return buildPublicPageMetadata({
    title: "ShipBoost Pricing | Free and Premium Launches",
    description,
    url: "/pricing",
  });
}

export const revalidate = 900;

function CheckItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5 text-sm font-medium text-foreground/70">
      <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
      {text}
    </li>
  );
}

export default async function PricingPage() {
  const env = getEnv();
  const isPrelaunch = env.NEXT_PUBLIC_PRELAUNCH_MODE === "true";
  const foundingPremiumLaunchLimit = env.FOUNDING_PREMIUM_LAUNCH_LIMIT;
  const [foundingSpotsLeft, foundingPremiumPrice] = await Promise.all([
    getRemainingFoundingPremiumLaunchSpots(),
    getPremiumLaunchPriceCard(),
  ]);

  const schema = buildPricingPageSchema({
    title: "Pricing",
    description: isPrelaunch
      ? "Choose the ShipBoost launch path that fits your product stage. Start free, reserve a Premium Launch, or use our partner submission service."
      : "Choose the ShipBoost launch path that fits your product stage. Start free, reserve a Premium Launch, or use our partner submission service.",
    url: `${env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return (
    <main className="flex-1 flex flex-col bg-muted/20 pt-32">
      <JsonLdScript data={schema} />
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 pb-32">

        {/* Page header */}
        <div className="max-w-2xl">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 mb-4">
            Pricing
          </p>
          <h1 className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
            Launch your product. Stay visible.
          </h1>
          <p className="mt-5 text-lg font-medium leading-relaxed text-muted-foreground/80">
            Anyone can get a launch day. ShipBoost gives you the visibility that
            compounds after it — through permanent listings, ranked categories,
            and editorial coverage that keeps working for months.
          </p>
        </div>

        {/* ── LAUNCH PLANS ── */}
        <div className="mt-16">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 mb-6">
            Launch plans
          </p>
          <div className="grid gap-5 sm:grid-cols-2">

            {/* Free Launch */}
            <article className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40">
                  Free launch
                </p>
                <ShieldCheck size={18} className="text-muted-foreground/30" />
              </div>
              <div className="mt-5">
                <span className="text-5xl font-black tracking-tighter text-foreground">$0</span>
                <span className="ml-2 text-sm font-bold text-muted-foreground">forever</span>
              </div>
              <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
                A credible public listing and a full week on the launchboard. Great for getting your first users — visibility tapers off after launch week.
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                <CheckItem text="One week on the launchboard" />
                <CheckItem text="Permanent public listing" />
                <CheckItem text="Indexed in categories, tags &amp; alternatives pages" />
                <CheckItem text="Backlink to your site once your badge is verified" />
              </ul>
              <Link
                href="/submit"
                className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted/50 px-6 py-3.5 text-sm font-black text-foreground transition-all hover:bg-muted active:scale-95"
              >
                Get started free
                <ArrowRight size={15} />
              </Link>
            </article>

            {/* Premium Launch */}
            <article className="relative flex flex-col rounded-3xl border border-primary bg-card p-7 shadow-sm ring-4 ring-primary/5">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap shadow-lg shadow-black/20">
                Founding offer
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] text-primary">
                  Premium launch
                </p>
                <Star size={18} className="text-primary" />
              </div>
              <div className="mt-5 flex items-end gap-3">
                {foundingPremiumPrice.compareAtPrice ? (
                  <span className="text-xl font-black text-muted-foreground line-through">
                    {foundingPremiumPrice.compareAtPrice}
                  </span>
                ) : null}
                <span className="text-5xl font-black tracking-tighter text-foreground">
                  {foundingPremiumPrice.currentPrice}
                </span>
                <span className="pb-1 text-sm font-bold text-muted-foreground">/ launch</span>
              </div>
              <p className="mt-1.5 text-[10px] font-black tracking-widest text-primary">
                {foundingSpotsLeft} of {foundingPremiumLaunchLimit} founding spots left
              </p>
              <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
                Reserve your launch week and get a hand-written editorial spotlight published on our blog — an asset that keeps sending you visitors long after launch day.
              </p>
              {!premiumLaunchAvailable && (
                <p className="mt-2 text-xs font-bold text-amber-700">{premiumLaunchUnavailableMessage}</p>
              )}
              <ul className="mt-6 flex-1 space-y-3">
                <CheckItem text="Reserve a specific launch week (you pick the date)" />
                <CheckItem text="Featured placement on the launchboard that week" />
                <CheckItem text="Hand-written editorial spotlight on our blog" />
                <CheckItem text="Long-term discovery through search and category pages" />
                <CheckItem text="Skip the badge verification step" />
                <CheckItem text="Guaranteed high quality dofollow backlink" />
              </ul>
              {premiumLaunchAvailable ? (
                <Link
                  href="/submit"
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-xl shadow-black/20 transition-all hover:opacity-90 active:scale-95"
                >
                  Reserve premium launch
                  <ArrowRight size={15} />
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="mt-8 inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl border border-border bg-muted/50 px-6 py-3.5 text-sm font-black text-muted-foreground/50"
                >
                  Temporarily unavailable
                </button>
              )}
            </article>
          </div>
        </div>

        {/* ── SPONSOR PLACEMENTS ── */}
        <div id="advertise" className="mt-20 scroll-mt-28">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 mb-2">
            Sponsor placements
          </p>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Reach founders who are actively evaluating tools.
          </h2>
          <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground">
            ShipBoost attracts builders in discovery mode — people actively looking for tools to use,
            not scrolling for entertainment. Pick the placement that fits your budget.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-3">

            {/* Product Ad — cheapest, left */}
            <article className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40">
                  Product Ad
                </p>
                <Package size={18} className="text-muted-foreground/30" />
              </div>
              <div className="mt-5">
                <span className="text-5xl font-black tracking-tighter text-foreground">$29</span>
                <span className="ml-2 text-sm font-bold text-muted-foreground">/ 30 days</span>
              </div>
              <p className="mt-4 flex-1 text-sm font-medium leading-relaxed text-muted-foreground">
                Native placement in the launchboard feed. Looks like an organic listing — founders read it as content, not an ad.
              </p>
              <ul className="mt-6 space-y-3">
                <CheckItem text="Highest-intent audience on ShipBoost" />
                <CheckItem text="30 days in the launchboard feed" />
                <CheckItem text="Full product card with logo, title & tagline" />
                <CheckItem text="Founders actively evaluating tools" />
                <CheckItem text="Limited to 2 slots for exclusivity" />
              </ul>
              <AdPreviewButton slot="INLINE_PRODUCT" className="mt-5 self-center" />
              <Link
                href="/launches/weekly?advertise=1"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted/50 px-6 py-3.5 text-sm font-black text-foreground transition-all hover:bg-muted active:scale-95"
              >
                Book product ad
                <ArrowRight size={15} />
              </Link>
            </article>

            {/* Banner Ad — middle */}
            <article className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40">
                  Banner Ad
                </p>
                <Newspaper size={18} className="text-muted-foreground/30" />
              </div>
              <div className="mt-5">
                <span className="text-5xl font-black tracking-tighter text-foreground">$49</span>
                <span className="ml-2 text-sm font-bold text-muted-foreground">/ 30 days</span>
              </div>
              <p className="mt-4 flex-1 text-sm font-medium leading-relaxed text-muted-foreground">
                Full-width animated banner injected mid-feed. High first-visit visibility — founders can't scroll past it.
              </p>
              <ul className="mt-6 space-y-3">
                <CheckItem text="Full-width in-feed placement" />
                <CheckItem text="High first-visit visibility" />
                <CheckItem text="30 days featured in the launchboard" />
                <CheckItem text="Full product card with logo, title & tagline" />
                <CheckItem text="Exclusive — 1 sponsor at a time" />
              </ul>
              <AdPreviewButton slot="INLINE_BANNER" className="mt-5 self-center" />
              <Link
                href="/launches/weekly?advertise=1"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted/50 px-6 py-3.5 text-sm font-black text-foreground transition-all hover:bg-muted active:scale-95"
              >
                Book banner ad
                <ArrowRight size={15} />
              </Link>
            </article>

            {/* Sidebar Ad — most visible, highlighted, right */}
            <article className="relative flex flex-col rounded-3xl border-2 border-primary bg-card p-7 shadow-sm ring-4 ring-primary/5">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-[10px] font-black tracking-widest whitespace-nowrap shadow-lg shadow-black/20">
                Most visible
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black tracking-[0.2em] text-primary">
                  Sidebar Ad
                </p>
                <Layout size={18} className="text-primary" />
              </div>
              <div className="mt-5">
                <span className="text-5xl font-black tracking-tighter text-foreground">$59</span>
                <span className="ml-2 text-sm font-bold text-muted-foreground">/ 30 days</span>
              </div>
              <p className="mt-4 flex-1 text-sm font-medium leading-relaxed text-muted-foreground">
                Your product card across every discovery page — homepage, categories, tags, and launch boards. Highest impression rate of any placement.
              </p>
              <ul className="mt-6 space-y-3">
                <CheckItem text="Highest impression rate of any slot" />
                <CheckItem text="Best for tools targeting active builders" />
                <CheckItem text="30 days across all discovery pages" />
                <CheckItem text="Full product card with logo, title & tagline" />
                <CheckItem text="Sponsored badge for trust & credibility" />
                <CheckItem text="Limited spots for exclusivity" />
              </ul>
              <AdPreviewButton slot="SIDEBAR" className="mt-5 self-center text-primary/60 hover:text-primary" />
              <Link
                href="/?advertise=1"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-xl shadow-black/20 transition-all hover:opacity-90 active:scale-95"
              >
                Book sidebar ad
                <ArrowRight size={15} />
              </Link>
            </article>
          </div>

          <p className="mt-5 text-center text-[11px] font-medium text-muted-foreground/50">
            One-time payment · No subscription · No auto-renewal · Approved tools only
          </p>
        </div>

        {/* ── SUBMISSION SERVICE ── */}
        <div className="mt-20">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 mb-6">
            Submission service
          </p>
          <div className="rounded-3xl border border-border bg-card p-7 shadow-sm sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Zap size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40">Partner offer</p>
                    <h2 className="text-lg font-black tracking-tight text-foreground">Done-for-you directory submission</h2>
                  </div>
                </div>
                <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground">
                  Manual submission to 30–100+ AI and startup directories with a detailed report after delivery.
                  Handled by our partner AI Directories — not automated, not scraped.
                </p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                  {[
                    "Starter: 30+ directories from $99",
                    "Pro: 60+ directories from $149",
                    "Premium: 100+ directories from $199",
                  ].map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm font-medium text-foreground/70">
                      <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="shrink-0">
                <TrackedExternalLink
                  href="https://www.aidirectori.es/pricing/?via=ShipBoost"
                  sourceSurface="pricing_page"
                  linkContext="pricing"
                  linkText="See partner plans"
                  className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-6 py-3.5 text-sm font-black text-background shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-95 whitespace-nowrap"
                >
                  See partner plans
                  <ArrowRight size={15} />
                </TrackedExternalLink>
              </div>
            </div>
          </div>
        </div>

      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
