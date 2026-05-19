import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home as HomeIcon } from "lucide-react";

import { FakeNotificationGenerator } from "@/components/free-tools/fake-notification-generator";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Footer } from "@/components/ui/footer";
import { getEnv } from "@/server/env";
import { getFreeTool } from "@/server/seo/free-tools";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildFreeToolPageSchema } from "@/server/seo/page-schema";

const tool = getFreeTool("fake-notification-generator");

export const revalidate = 3600;

export const metadata: Metadata = buildPublicPageMetadata({
  title: `${tool.metaTitle} | ShipBoost`,
  description: tool.metaDescription,
  url: "/free-tools/fake-notification-generator",
});

export default function FakeNotificationGeneratorPage() {
  const env = getEnv();
  const url = `${env.NEXT_PUBLIC_APP_URL}/free-tools/fake-notification-generator`;
  const schema = buildFreeToolPageSchema({
    name: tool.title,
    description: tool.metaDescription,
    url,
    applicationCategory: tool.applicationCategory,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Free Tools", url: `${env.NEXT_PUBLIC_APP_URL}/free-tools` },
      { name: tool.title, url },
    ],
    howTo: tool.howTo,
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
            Fake notification generator for app mockups
          </h1>
          <p className="mt-5 text-lg font-medium leading-8 text-muted-foreground">
            {tool.intro} Create Instagram notifications, Discord notifications,
            fake text notification-style assets, payment alerts, and custom app
            mockups for ethical creative use.
          </p>
        </header>

        <div className="mt-10">
          <FakeNotificationGenerator />
        </div>

        <section className="mt-16">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-muted-foreground">
              Mockup workflows
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-foreground">
              Build realistic iPhone notification mockups for the channels people recognize.
            </h2>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              {
                title: "Instagram notification mockups",
                body: "Use the Instagram preset as a fake Instagram notification maker for social posts, launch announcements, demo thumbnails, and design examples. Edit the title and message so the mockup clearly fits your creative asset.",
              },
              {
                title: "Discord fake notification assets",
                body: "The Discord preset works well for community demos, onboarding screenshots, and product storytelling where you need a notification-style visual without exposing real messages.",
              },
              {
                title: "Payment and order notification mockups",
                body: "Stripe, Shopify, and PayPal presets help founders create revenue, checkout, and order notification visuals for landing pages, pitch decks, launch recaps, and educational examples.",
              },
              {
                title: "iPhone notification mockups",
                body: "Theme, wallpaper, status text, and notification position controls make it easy to produce an iPhone-style notification mockup with a consistent visual frame.",
              },
              {
                title: "Custom app notifications",
                body: "Choose the custom app preset when you want a branded notification mockup for your own SaaS, mobile app, newsletter, or internal demo.",
              },
              {
                title: "Ethical use",
                body: "This generator is for mockups and creative assets. Do not use fake notifications to impersonate another person, fabricate proof, deceive customers, or misrepresent real account activity.",
              },
            ].map((section) => (
              <section
                key={section.title}
                className="rounded-[1.5rem] border border-border bg-card p-5 shadow-sm"
              >
                <h3 className="text-xl font-black tracking-tight text-foreground">
                  {section.title}
                </h3>
                <p className="mt-3 text-base font-medium leading-8 text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </section>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <aside className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight">Related ShipBoost links</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {tool.relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </aside>

          <aside className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-black tracking-tight">Useful references</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                {
                  label: "Apple notification design",
                  href: "https://developer.apple.com/design/human-interface-guidelines/notifications",
                },
                {
                  label: "Instagram notification settings",
                  href: "https://help.instagram.com/918918124885367",
                },
                {
                  label: "Discord notifications",
                  href: "https://support.discord.com/hc/en-us/articles/215253258-Notifications-Settings-101",
                },
                {
                  label: "Stripe payment notifications",
                  href: "https://docs.stripe.com/payments/checkout/custom-success-page",
                },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl border border-border bg-background px-4 py-3 text-sm font-black text-foreground transition-colors hover:bg-muted"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </aside>
        </div>

        <section className="mt-14 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight">
            Fake notification generator FAQ
          </h2>
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
