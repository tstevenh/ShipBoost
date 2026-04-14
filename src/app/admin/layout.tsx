import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getServerSession } from "@/server/auth/session";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <main className="flex-1 flex flex-col bg-secondary/30 pt-32">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 mb-32">
        <div className="mb-12 rounded-[2.5rem] border border-border bg-card p-10 shadow-xl shadow-black/5">
          <p className="text-[10px] font-black tracking-[0.3em] text-primary  mb-4">
            Admin access confirmed
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            ShipBoost moderation console
          </h1>
          <p className="mt-6 max-w-4xl text-lg font-medium leading-relaxed text-muted-foreground/80">
            This interface now sits on top of the protected admin API. Use it to
            process founder submissions, seed listings, and keep the catalog
            intentionally narrow.
          </p>
          <div className="mt-8 inline-flex rounded-xl border border-border bg-muted/50 px-4 py-2 text-xs font-bold text-muted-foreground  tracking-widest">
            Signed in as {session.user.email}
          </div>
        </div>

        {children}
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
