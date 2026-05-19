import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ExternalLink, Home as HomeIcon } from "lucide-react";

import { ReactionTimeTestTool } from "@/components/free-tools/reaction-time-test-tool";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Footer } from "@/components/ui/footer";
import { getEnv } from "@/server/env";
import { getFreeTool } from "@/server/seo/free-tools";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildFreeToolPageSchema } from "@/server/seo/page-schema";

const tool = getFreeTool("reaction-time-test");

const benchmarkBands = [
  {
    label: "Elite reflex range",
    value: "120-170 ms",
    description:
      "A rare range usually seen in trained players on low-latency desktop setups.",
  },
  {
    label: "Fast",
    value: "170-220 ms",
    description:
      "Strong for a visual reflex test and a useful target for competitive gaming warmups.",
  },
  {
    label: "Typical",
    value: "220-280 ms",
    description:
      "A normal result for many people, especially on laptop trackpads and mobile taps.",
  },
  {
    label: "Needs a cleaner setup",
    value: "280+ ms",
    description:
      "Often caused by distraction, fatigue, wireless latency, display lag, or an awkward hand position.",
  },
];

const depthSections = [
  {
    eyebrow: "Testing method",
    title: "How this reaction time test measures reflex speed",
    body: "Press start, wait for the visual cue, then click or tap as soon as the test changes state. The tool records the delay between the cue and your response in milliseconds, stores the last five valid rounds, and calculates best and average scores so one lucky click does not define the session.",
  },
  {
    eyebrow: "Human Benchmark comparison",
    title: "Use it like a Human Benchmark reaction time session",
    body: "People often compare scores with Human Benchmark because the interaction is easy to understand: wait, react, repeat. This version keeps the same reflex-test pattern while making the five-round history, average score, best score, sharing, and PNG download visible in one place.",
  },
  {
    eyebrow: "Gaming context",
    title: "Reaction time test for gamers",
    body: "For FPS, racing, fighting games, rhythm games, and aim trainers, a lower visual reaction time can help, but it is only one input. Crosshair placement, anticipation, server tick rate, device latency, and decision-making often matter more than shaving a few milliseconds from a reflex test.",
  },
  {
    eyebrow: "Driver context",
    title: "F1-style starts and false-start discipline",
    body: "Formula racing starts are closer to this test than many sports because drivers wait for a visual cue and must react without jumping early. Use the result as entertainment and benchmarking, not as a professional driver assessment.",
  },
];

const improvementTips = [
  "Run sets on the same device, browser, mouse, keyboard, or touchscreen so your comparisons stay fair.",
  "Use a wired mouse or a high-refresh display when you want the cleanest desktop benchmark.",
  "Take breaks between attempts. Fatigue and frustration usually make averages worse.",
  "Do not guess. Early clicks invalidate the reflex pattern and make your average meaningless.",
  "Warm up with a few practice rounds before saving or sharing a result.",
  "Track your average over multiple five-round sets instead of chasing one unusually fast score.",
];

const resourceLinks = [
  {
    label: "Human Benchmark reaction time test",
    href: "https://humanbenchmark.com/tests/reactiontime",
    description: "A widely known comparison point for online reaction time scores.",
  },
  {
    label: "Mental chronometry overview",
    href: "https://en.wikipedia.org/wiki/Mental_chronometry",
    description: "Background on measuring processing speed and response latency.",
  },
  {
    label: "MDN performance.now()",
    href: "https://developer.mozilla.org/en-US/docs/Web/API/Performance/now",
    description: "Browser timing API reference for high-resolution timestamps.",
  },
  {
    label: "World Athletics false start rule",
    href: "https://worldathletics.org/about-iaaf/documents/book-of-rules",
    description: "Official rules source for start procedures and false-start thresholds.",
  },
];

export const revalidate = 3600;

export const metadata: Metadata = buildPublicPageMetadata({
  title: `${tool.metaTitle} | ShipBoost`,
  description: tool.metaDescription,
  url: "/free-tools/reaction-time-test",
});

export default function ReactionTimeTestPage() {
  const env = getEnv();
  const url = `${env.NEXT_PUBLIC_APP_URL}/free-tools/reaction-time-test`;
  const schema = buildFreeToolPageSchema({
    name: tool.title,
    description: tool.metaDescription,
    url,
    type: "WebApplication",
    applicationCategory: tool.applicationCategory,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Free Tools", url: `${env.NEXT_PUBLIC_APP_URL}/free-tools` },
      { name: tool.title, url },
    ],
    faq: tool.faq,
  });

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <article className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-16 pt-24 sm:pb-20 sm:pt-28">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          <Link href="/" className="flex items-center gap-1 hover:text-foreground">
            <HomeIcon size={12} aria-hidden="true" /> Home
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <Link href="/free-tools" className="hover:text-foreground">
            Free tools
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-foreground">{tool.shortTitle}</span>
        </nav>

        <header className="mt-12 max-w-4xl">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
            {tool.primaryKeyword}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Reaction time test online
          </h1>
          <p className="mt-5 text-lg font-medium leading-8 text-muted-foreground">
            {tool.intro} Compare your session with common reflex test ranges,
            Human Benchmark-style expectations, and practical gaming context.
          </p>
        </header>

        <div className="mt-10">
          <ReactionTimeTestTool />
        </div>

        <section className="mt-14">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
              Score ranges
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
              What your reaction time score means
            </h2>
            <p className="mt-3 text-base font-medium leading-8 text-muted-foreground">
              Reaction time benchmarks vary by age, device, browser, refresh rate,
              input latency, sleep, and attention. Treat these ranges as a practical
              online reflex test guide, then compare yourself against your own
              repeated sessions.
            </p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {benchmarkBands.map((band) => (
              <div
                key={band.label}
                className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {band.label}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-foreground">
                  {band.value}
                </p>
                <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">
                  {band.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_0.74fr]">
          <section className="space-y-8">
            {depthSections.map((section) => (
              <section
                key={section.title}
                className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                  {section.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">
                  {section.title}
                </h2>
                <p className="mt-3 text-base font-medium leading-8 text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}

            <section className="rounded-[1.5rem] border border-border bg-card p-6 shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                Improve your average
              </p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">
                How to get a cleaner reflex test score
              </h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {improvementTips.map((tip) => (
                  <div key={tip} className="rounded-2xl bg-background p-4">
                    <p className="text-sm font-semibold leading-6 text-muted-foreground">
                      {tip}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-black tracking-tight">Related free tools</h2>
              <div className="mt-4 grid gap-3">
                {tool.relatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/resources/startup-directories"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-muted"
                >
                  Startup directories list
                </Link>
                <Link
                  href="/best"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-muted"
                >
                  Best software guides
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-black tracking-tight">Useful references</h2>
              <div className="mt-4 grid gap-3">
                {resourceLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-border bg-background px-4 py-3 transition-colors hover:bg-muted"
                  >
                    <span className="flex items-center gap-2 text-sm font-black text-foreground">
                      {link.label}
                      <ExternalLink size={13} aria-hidden="true" />
                    </span>
                    <span className="mt-1 block text-xs font-medium leading-5 text-muted-foreground">
                      {link.description}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-14 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight">Reaction time test FAQ</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {tool.faq.map((item) => (
              <div key={item.question} className="rounded-2xl bg-background p-5">
                <h3 className="font-black text-foreground">{item.question}</h3>
                <p className="mt-2 text-sm font-medium leading-7 text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      </article>
      <Footer />
    </main>
  );
}
