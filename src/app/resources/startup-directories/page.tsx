import { StartupDirectoriesResource } from "@/components/resources/startup-directories-resource";
import { ResourceUnlockPanel } from "@/components/resources/resource-unlock-panel";
import { startupDirectories } from "@/content/resources/startup-directories";
import { getServerSession } from "@/server/auth/session";

export const revalidate = 3600;

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
          Startup directories
        </h1>
        <p className="text-base font-medium leading-7 text-muted-foreground">
          The fast hosted version of your directories sheet inside ShipBoost.
          Search it, sort it, and work through it without bouncing between tabs.
        </p>
      </div>

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
                hosted list.
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
