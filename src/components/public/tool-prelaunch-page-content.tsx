import Image from "next/image";

import { ToolPrelaunchCountdown } from "@/components/public/tool-prelaunch-countdown";
import { Footer } from "@/components/ui/footer";

type PrelaunchTool = {
  name: string;
  tagline: string;
  logoMedia: { url: string } | null;
};

export function ToolPrelaunchPageContent({
  tool,
  launchDate,
}: {
  tool: PrelaunchTool;
  launchDate: Date | string;
}) {
  const launchDateValue =
    launchDate instanceof Date ? launchDate : new Date(launchDate);
  const launchDateIso = launchDateValue.toISOString();

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <section className="flex min-h-[calc(100vh+240px)] flex-1 items-start border-b border-border px-6 pb-80 pt-32 sm:pt-40">
        <div className="mx-auto w-full max-w-5xl">
          <div className="space-y-10">
            <div className="flex flex-col gap-7 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                {tool.logoMedia ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={tool.logoMedia.url}
                      alt={`${tool.name} logo`}
                      fill
                      sizes="96px"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <span className="text-3xl font-black text-muted-foreground/40">
                    {tool.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
                  {tool.name}
                </h1>
                <p className="mt-4 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground">
                  {tool.tagline}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Launching in
              </h2>
              <ToolPrelaunchCountdown launchDate={launchDateIso} />
            </div>
          </div>
        </div>
      </section>
      <Footer hideFeaturedBadgeRail />
    </main>
  );
}
