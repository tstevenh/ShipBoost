import Link from "next/link";

type InternalLinkItem = {
  href: string;
  label: string;
  description?: string;
};

type InternalLinkSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  links: InternalLinkItem[];
};

function getPreferredLinkCount(count: number) {
  if (count >= 6) {
    return 6;
  }

  if (count >= 3) {
    return 3;
  }

  return count;
}

export function InternalLinkSection({
  eyebrow,
  title,
  description,
  links,
}: InternalLinkSectionProps) {
  const visibleLinks = links.slice(0, getPreferredLinkCount(links.length));

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
      {eyebrow ? (
        <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-3xl text-base font-medium leading-relaxed text-muted-foreground/80">
          {description}
        </p>
      ) : null}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleLinks.map((link) => (
          <Link
            key={`${link.href}:${link.label}`}
            href={link.href}
            className="rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5"
          >
            <p className="text-sm font-black text-foreground">{link.label}</p>
            {link.description ? (
              <p className="mt-2 text-xs font-medium leading-relaxed text-muted-foreground">
                {link.description}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
