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
    "Browse ShipBoost's 300+ startup directories resource with a public preview, then unlock the full hosted list inside your founder workflow.",
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
          300+ startup directories, organized for faster launches.
        </h1>
        <p className="text-base font-medium leading-7 text-muted-foreground">
          This is the hosted version of the startup directories list ShipBoost
          uses for founder distribution. Search it, sort it, and move faster
          without juggling spreadsheets or scattered bookmarks.
        </p>
      </div>

      <section className="mt-8 rounded-[2rem] border border-primary/15 bg-primary/5 px-6 py-6 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-[10px] font-black tracking-[0.3em] text-primary">
            Founder options
          </p>
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Use the list yourself or let ShipBoost handle distribution.
          </h2>
          <p className="text-sm font-medium leading-7 text-muted-foreground">
            If you want hands-on control, submit your product and choose your
            launch path. If you want help turning this directory list into
            actual distribution, use our done-for-you support option.
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
              Get done-for-you distribution
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
