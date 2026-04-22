import type { Metadata } from "next";
import Link from "next/link";

import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";
import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildSimpleWebPageSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "About ShipBoost | Founder Story and Product Vision",
  description:
    "Read the founder story behind ShipBoost, why it was built for bootstrapped SaaS founders, and why trust-first distribution beats vanity launches.",
  url: "/about",
  openGraphType: "article",
});

export default function AboutPage() {
  const env = getEnv();
  const schema = buildSimpleWebPageSchema({
    type: "AboutPage",
    title: "About ShipBoost",
    description:
      "The founder story behind ShipBoost, a trust-first launch and distribution platform for bootstrapped SaaS founders.",
    url: `${env.NEXT_PUBLIC_APP_URL}/about`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="About"
        title="ShipBoost is built for SaaS founders who want trust and real distribution"
        description="Too many serious products get buried in vanity launches and low-trust directories. ShipBoost gives founders a cleaner place to look credible, get discovered, and keep momentum after launch day."
        finalCtaTitle="If your product is ready, launch it with more signal"
        finalCtaDescription="ShipBoost is built for bootstrapped SaaS founders who care about credibility, practical distribution, and staying discoverable after the first spike."
      >
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm sm:p-10">
          <div className="max-w-4xl space-y-5">
            <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
              In practice
            </p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              What ShipBoost actually does
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Weekly launch board visibility",
                "Founder-ready public listings",
                "Category and tag discovery paths",
                "Alternatives pages built for comparison intent",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border bg-muted/20 p-5 text-sm font-bold text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="text-base font-medium leading-relaxed text-muted-foreground/80">
              ShipBoost is built for bootstrapped SaaS founders who want a
              cleaner launch surface and a public asset that keeps doing work
              after launch day instead of disappearing into a one-day spike or a
              dead directory archive.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm sm:p-10">
          <div className="max-w-4xl space-y-6 text-base font-medium leading-relaxed text-muted-foreground/80">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Why I started ShipBoost
            </h2>
            <p>
              I kept seeing the same pattern over and over. Good bootstrapped
              SaaS products were being launched into surfaces that looked busy
              but did not build much trust. Founders would spend days polishing
              a launch, writing copy, preparing screenshots, asking friends for
              support, and pushing for attention, only to get a short spike and
              then disappear into the archive. The product might be strong. The
              founder might be serious. But the environment around the launch
              made it all feel temporary, noisy, and easy to forget.
            </p>
            <p>
              That bothered me because most bootstrapped founders do not need
              another vanity metric. They do not need the illusion of momentum.
              They need a place where the right person can discover the product,
              understand what it does, and trust it enough to click through. In
              other words, they do not just need exposure. They need context.
              They need structure. They need credibility.
            </p>
            <p>
              That is the real reason ShipBoost exists. I did not build it to
              be a noisy startup feed, a random startup cemetery, or a generic
              tools list filled with low-trust pages. I built it because I
              wanted a better system for launch and discovery. One that gives
              founders a cleaner surface, clearer rules, and a public listing
              that keeps working after launch day instead of dying the moment
              the homepage rotates.
            </p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              The problem I kept seeing
            </h2>
            <div className="mt-5 space-y-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              <p>
                Too many launch platforms optimize for the spike instead of the
                outcome. They create a rush of attention for a day, but they do
                not do much to help a founder look credible when the right
                visitor shows up. They also do not create much structure for
                ongoing discovery. Once the moment passes, the listing becomes
                hard to find, hard to trust, or hard to care about.
              </p>
              <p>
                Directories often have the opposite problem. They stay online,
                but they become bloated, low-signal, and hard to navigate. A
                founder gets listed, but the listing sits in a giant pile with
                no real positioning, no launch context, and no clear path for
                discovery. That is not distribution. That is just storage.
              </p>
            </div>
          </article>

          <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              What I wanted instead
            </h2>
            <div className="mt-5 space-y-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              <p>
                I wanted a product that treated trust as part of distribution. A
                founder should be able to launch, look legitimate, and stay
                discoverable without needing to manufacture hype. The page
                should feel curated. The rules should be clear. The product
                should not be competing against clutter for basic attention.
              </p>
              <p>
                That is why ShipBoost is built around weekly launches, clean
                listing pages, and supporting discovery surfaces like categories,
                tags, and alternatives. The launch is important, but the launch
                is not the whole point. The point is to help good products keep
                showing up after the launch window ends.
              </p>
            </div>
          </article>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm sm:p-10">
          <div className="max-w-4xl space-y-6 text-base font-medium leading-relaxed text-muted-foreground/80">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              What ShipBoost is trying to do differently
            </h2>
            <p>
              ShipBoost is a launch and distribution platform for bootstrapped
              SaaS founders. That description matters because I do not see these
              as separate jobs. Launch without distribution becomes a short-term
              performance. Distribution without trust becomes weak SEO furniture.
              ShipBoost is meant to sit in the middle. It gives founders a
              cleaner launch surface, a more credible public profile, and a set
              of discovery paths that can keep working long after the first
              cohort ends.
            </p>
            <p>
              Weekly launches are part of that philosophy. A weekly board gives
              products more room than a daily reset. It creates a structure
              where launches can actually be compared, where featured placement
              means something, and where good products are not instantly pushed
              out of sight. It is a better fit for founders who are trying to
              build momentum with limited time and limited margin for wasted
              motion.
            </p>
            <p>
              The directory side matters too. I wanted listings to feel useful,
              not disposable. That means cleaner pages, clearer categories,
              stronger alternatives paths, and a better way for buyers, founders,
              and operators to discover products based on relevance instead of
              just recency. If someone lands on a ShipBoost page, I want them to
              understand what the product is, why it matters, and where to go
              next. That is a very different standard from just collecting as
              many listings as possible.
            </p>
            <p>
              This is also why the brand is intentionally sharp and restrained.
              I do not want ShipBoost to feel like startup theater. I want it to
              feel operator-led. Clear hierarchy. Real trust cues. Less fluff.
              More structure. If the environment feels serious, the products
              inside it have a better chance of being taken seriously too.
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm sm:p-10">
          <div className="max-w-4xl space-y-6 text-base font-medium leading-relaxed text-muted-foreground/80">
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Who ShipBoost is for
            </h2>
            <p>
              I built ShipBoost for bootstrapped SaaS founders who care about
              practical growth. The kind of founder who wants a product to look
              credible, a launch to mean something, and distribution to keep
              working after the initial wave. If you are trying to build a real
              business instead of collecting screenshots of temporary attention,
              ShipBoost is for you.
            </p>
            <p>
              It is especially for founders who are tired of false choices. You
              should not have to choose between a hype-driven launch and a dead
              directory listing. You should not have to choose between credibility
              and visibility. You should not have to choose between launch day
              attention and long-term discoverability. A better system should
              give you all three: trust, visibility, and momentum.
            </p>
            <p>
              If you want the mechanics, you can read{" "}
              <Link
                href="/how-it-works"
                className="font-black text-foreground hover:underline underline-offset-4"
              >
                how ShipBoost works
              </Link>
              . If you are comparing paths, you can review{" "}
              <Link
                href="/pricing"
                className="font-black text-foreground hover:underline underline-offset-4"
              >
                the launch options
              </Link>
              . And if your product is already ready, you can{" "}
              <Link
                href="/submit"
                className="font-black text-foreground hover:underline underline-offset-4"
              >
                submit your product here
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm sm:p-10">
          <div className="max-w-3xl space-y-5">
            <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
              Founder note
            </p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              I want ShipBoost to be the kind of place I would actually trust if
              I were launching my own SaaS here
            </h2>
            <p className="text-base font-medium leading-relaxed text-muted-foreground/80">
              That is the standard behind the product. Less vanity. Less junk.
              More trust. More structure. More useful discovery. If ShipBoost
              keeps doing that well, it will be worth building for a long time.
            </p>
            <div className="pt-2 text-sm font-medium text-muted-foreground">
              <p className="font-black text-foreground">Tim Hart</p>
              <p>Founder, ShipBoost</p>
              <TrackedExternalLink
                href="https://x.com/Timhrt_"
                target="_blank"
                rel="noreferrer"
                sourceSurface="about_page"
                linkContext="about"
                linkText="Follow Tim Hart on X"
                className="mt-3 inline-flex text-sm font-black text-foreground hover:underline underline-offset-4"
              >
                Follow on X
              </TrackedExternalLink>
            </div>
          </div>
        </section>
      </ContentPageShell>
    </>
  );
}
