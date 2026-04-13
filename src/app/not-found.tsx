import Link from "next/link";

import { Footer } from "@/components/ui/footer";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-muted/20 pt-32">
      <section className="mx-auto w-full max-w-4xl flex-1 px-6">
        <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-12">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
            Error
          </p>
          <h1 className="mt-4 text-5xl font-black tracking-tight text-foreground sm:text-6xl">
            Page not found
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground/80 sm:text-xl">
            The page you tried to open does not exist, may have moved, or is no
            longer part of the current ShipBoost route set.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 active:scale-95"
            >
              Go home
            </Link>
            <Link
              href="/submit"
              className="inline-flex items-center justify-center rounded-2xl border border-border bg-card px-8 py-4 text-sm font-black text-foreground transition hover:bg-muted active:scale-95"
            >
              Submit your product
            </Link>
          </div>
        </div>

        <section className="grid gap-6 py-12 md:grid-cols-3">
          <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              How It Works
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              See how free launches, Premium Launches, and weekly ranking work.
            </p>
            <Link
              href="/how-it-works"
              className="mt-6 inline-block text-sm font-black text-foreground hover:underline underline-offset-4"
            >
              Read the guide
            </Link>
          </article>

          <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Launch Guide
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              Get the practical launch framework founders use before they submit.
            </p>
            <Link
              href="/launch-guide"
              className="mt-6 inline-block text-sm font-black text-foreground hover:underline underline-offset-4"
            >
              Open the guide
            </Link>
          </article>

          <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              Pricing
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              Compare the free path and Premium Launch before you choose a slot.
            </p>
            <Link
              href="/pricing"
              className="mt-6 inline-block text-sm font-black text-foreground hover:underline underline-offset-4"
            >
              View pricing
            </Link>
          </article>
        </section>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
