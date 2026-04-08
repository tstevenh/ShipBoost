import type { Metadata } from "next";
import Link from "next/link";

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
    points: [
      "Featured launch placement",
      "Priority launch weighting",
      "Scheduled launch date support",
      "Same submission flow, with checkout",
    ],
  },
  {
    name: "Done-for-you distribution",
    price: "Custom",
    description:
      "Hands-on distribution support for founders who want Shipboost to help push the launch further.",
    eyebrow: "Higher-touch service",
    ctaLabel: "Link coming soon",
    ctaHref: null,
    highlight: false,
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
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold tracking-[0.28em] text-[#9f4f1d] uppercase">
          Pricing
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-black sm:text-6xl">
          Simple launch options for bootstrapped SaaS founders.
        </h1>
        <p className="mt-6 text-lg leading-8 text-black/68">
          Start with a free listing, pay for a featured launch when you want a
          stronger push, and keep the done-for-you service block ready for the
          higher-touch offer.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {pricingTiers.map((tier) => (
          <article
            key={tier.name}
            className={`flex h-full flex-col rounded-[2rem] border p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] ${
              tier.highlight
                ? "border-[#9f4f1d]/30 bg-[#fff7ea]"
                : "border-black/10 bg-white"
            }`}
          >
            <p className="text-sm font-semibold tracking-[0.2em] text-[#9f4f1d] uppercase">
              {tier.eyebrow}
            </p>
            <h2 className="mt-5 text-2xl font-semibold text-black">
              {tier.name}
            </h2>
            <p className="mt-4 text-5xl font-semibold tracking-tight text-black">
              {tier.price}
            </p>
            <p className="mt-4 text-sm leading-7 text-black/68">
              {tier.description}
            </p>

            <ul className="mt-8 space-y-3 text-sm leading-6 text-black/72">
              {tier.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-[#143f35]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8">
              {tier.ctaHref ? (
                <Link
                  href={tier.ctaHref}
                  className={`inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                    tier.highlight
                      ? "bg-[#9f4f1d] text-white hover:bg-[#874218]"
                      : "bg-[#143f35] text-white hover:bg-[#0d2e26]"
                  }`}
                >
                  {tier.ctaLabel}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-black/10 bg-[#f3eee5] px-5 py-3 text-sm font-semibold text-black/45"
                >
                  {tier.ctaLabel}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      <section className="mt-12 rounded-[2rem] border border-black/10 bg-white/85 p-8 shadow-[0_16px_50px_rgba(0,0,0,0.06)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-[#9f4f1d] uppercase">
              What this page is for
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-black">
              Keep the offer legible before founders enter the submission flow.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-black/68">
              The first version stays intentionally simple. Free listing and
              featured launch both route into the existing submission flow. The
              done-for-you block is present so the offer has a public home even
              before the service link is finalized.
            </p>
          </div>

          <div className="rounded-[1.75rem] border border-black/10 bg-[#1d1c1a] p-6 text-[#f6e8d4] shadow-[0_28px_90px_rgba(29,28,26,0.2)]">
            <p className="text-sm font-semibold tracking-[0.22em] text-[#f3c781] uppercase">
              Current flow
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[#f6e8d4]/85">
              <li>Free listing and free launch stay self-serve.</li>
              <li>Featured launch is paid inside the current checkout flow.</li>
              <li>Premium distribution can be linked in later without redesigning this page.</li>
            </ul>
          </div>
        </div>
      </section>
    </section>
  );
}
