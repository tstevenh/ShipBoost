import type { Metadata } from "next";
import Link from "next/link";

import { StartupDirectoriesResource } from "@/components/resources/startup-directories-resource";
import { ResourceUnlockPanel } from "@/components/resources/resource-unlock-panel";
import { startupDirectories } from "@/content/resources/startup-directories";
import { getServerSession } from "@/server/auth/session";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";

export const revalidate = 3600;

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Startup Directories Resource | ShipBoost",
  description:
    "Browse 300+ startup directories and launch sites in one searchable ShipBoost resource built to help founders plan distribution faster.",
  url: "/resources/startup-directories",
});

export default async function StartupDirectoriesPage() {
  const session = await getServerSession();
  const previewCount = Math.min(
    12,
    startupDirectories.filter((item) => item.domain !== "reddit.com").length,
  );

  return (
    <main
      id="top"
      className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 sm:py-20"
    >
      <div className="max-w-4xl space-y-4">
        <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
          {session ? "Signed-in resource" : "Public preview"}
        </p>
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          300+ startup directories and launch sites in one clean, searchable list.
        </h1>
        <p className="text-base font-medium leading-7 text-muted-foreground">
          Search and sort the ShipBoost startup directories resource by DR,
          name, and domain. Skip scattered bookmarks, reduce blind submissions,
          and move faster when planning founder distribution.
        </p>
      </div>

      {!session ? (
        <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
              What founders use this for
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                "Build a launch shortlist faster",
                "Prioritize higher-DR opportunities first",
                "Keep distribution research in one place",
                "Avoid wasting time on scattered tabs and bookmarks",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border bg-muted/20 px-4 py-4 text-sm font-bold text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
            <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
              What&apos;s included
            </p>
            <ul className="mt-4 space-y-3">
              {[
                "300+ startup directories and launch sites",
                "Site name and URL",
                "DR sorting and search",
                "Hosted access inside ShipBoost",
              ].map((item) => (
                <li
                  key={item}
                  className="text-sm font-bold leading-relaxed text-foreground/85"
                >
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs font-medium leading-relaxed text-muted-foreground">
              This public resource is designed for speed and convenience. It does
              not promise private ops notes or hidden submission intelligence.
            </p>
          </article>
        </section>
      ) : null}

      <section className="mt-8 rounded-[2rem] border border-primary/15 bg-primary/5 px-6 py-6 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-[10px] font-black tracking-[0.3em] text-primary">
            Founder options
          </p>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Want more than a list?
          </h2>
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            ShipBoost helps founders move from research into real launch
            distribution with weekly launch boards, founder-ready listings, and
            long-tail discovery pages. Use the resource for planning, then use
            ShipBoost when you are ready to launch.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/submit"
              className="inline-flex items-center justify-center rounded-2xl bg-foreground px-5 py-3 text-sm font-black text-background transition-all hover:opacity-90 active:scale-95"
            >
              Submit your product
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-5 py-3 text-sm font-black text-foreground transition-all hover:bg-muted active:scale-95"
            >
              Compare launch pricing
            </Link>
          </div>
        </div>
      </section>

      {session ? (
        <div className="mt-8">
          <StartupDirectoriesResource />
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          <ResourceUnlockPanel />

          <section className="space-y-4">
            <div className="max-w-3xl space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Preview the sheet before you unlock it.
              </h2>
              <p className="text-sm font-medium leading-7 text-muted-foreground">
                This preview shows {previewCount} real directories from the
                full 300+ directory list.
              </p>
            </div>

            <StartupDirectoriesResource preview />

            <div className="flex justify-center pt-2">
              <a
                href="#top"
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-6 py-4 text-sm font-black text-foreground shadow-sm transition-all hover:bg-muted active:scale-95"
              >
                See the full list
              </a>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
