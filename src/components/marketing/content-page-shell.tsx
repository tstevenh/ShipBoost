import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Footer } from "@/components/ui/footer";

type ContentPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  children: React.ReactNode;
  finalCtaTitle?: string;
  finalCtaDescription?: string;
};

export function ContentPageShell({
  eyebrow,
  title,
  description,
  primaryCtaLabel = "Submit your product",
  primaryCtaHref = "/submit",
  secondaryCtaLabel = "View pricing",
  secondaryCtaHref = "/pricing",
  children,
  finalCtaTitle = "Ready to launch with more signal and less noise?",
  finalCtaDescription = "Start with a free launch or reserve a Premium Launch week.",
}: ContentPageShellProps) {
  return (
    <main className="flex-1 flex flex-col bg-muted/20 pt-32">
      <section className="mx-auto w-full max-w-5xl px-6">
        <div className="space-y-6 rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-12">
          <p className="text-[10px] font-black  tracking-[0.3em] text-foreground/40">
            {eyebrow}
          </p>
          <h1 className="text-5xl font-black tracking-tight text-foreground  sm:text-6xl">
            {title}
          </h1>
          <p className="max-w-3xl text-lg font-medium leading-relaxed text-muted-foreground/80 sm:text-xl">
            {description}
          </p>
          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 active:scale-95"
            >
              {primaryCtaLabel}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={secondaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-8 py-4 text-sm font-black text-foreground transition hover:bg-muted active:scale-95"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="space-y-12 py-12">{children}</div>

        <section className="mb-32 rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-12">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-foreground  sm:text-4xl">
              {finalCtaTitle}
            </h2>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              {finalCtaDescription}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 active:scale-95"
            >
              {primaryCtaLabel}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={secondaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-8 py-4 text-sm font-black text-foreground transition hover:bg-muted active:scale-95"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </section>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
