import Link from "next/link";
import { ExternalLink, Megaphone } from "lucide-react";

import { LogoFallback } from "@/components/ui/logo-fallback";

type SponsorPlacement = {
  id: string;
  tool: {
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    toolCategories: Array<{
      category: { name: string; slug: string };
    }>;
  };
};

function EmptySponsorSlot() {
  return (
    <Link
      href="/advertise"
      className="group block min-h-[118px] w-full max-w-[250px] rounded-xl border border-dashed border-border bg-card/70 p-[18px] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card"
    >
      <div className="flex h-full items-start gap-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Megaphone size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black tracking-[0.18em] text-muted-foreground">
            SPONSOR SLOT
          </p>
          <p className="mt-2 text-sm font-black tracking-tight text-foreground">
            Advertise here
          </p>
          <p className="mt-1.5 text-[11px] font-semibold leading-relaxed text-muted-foreground">
            Promote your product
          </p>
        </div>
      </div>
    </Link>
  );
}

function SponsorCard({ placement }: { placement: SponsorPlacement }) {
  return (
    <a
      href={placement.tool.websiteUrl}
      target="_blank"
      rel="noreferrer sponsored"
      className="group block min-h-[118px] w-full max-w-[250px] rounded-xl border border-border bg-card p-[14px] shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-black/5"
    >
      <div className="flex h-full flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-[8px] font-black tracking-[0.22em] text-muted-foreground/55">
              SPONSORED
            </span>
            <span className="h-px min-w-0 flex-1 bg-border" />
          </div>
          <span className="shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-[9px] font-black text-muted-foreground">
            ShipBoost Ads
          </span>
        </div>

        <div className="flex items-center justify-between gap-2.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <LogoFallback
              name={placement.tool.name}
              src={placement.tool.logoMedia?.url}
              websiteUrl={placement.tool.websiteUrl}
              sizes="38px"
              className="h-[38px] w-[38px] rounded-lg border border-border"
              textClassName="text-xs"
            />
            <h3 className="line-clamp-1 text-sm font-black tracking-tight text-foreground">
              {placement.tool.name}
            </h3>
          </div>
          <ExternalLink
            size={15}
            className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
          />
        </div>

        <p className="line-clamp-2 text-center text-xs font-semibold leading-snug text-muted-foreground">
          {placement.tool.tagline}
        </p>
      </div>
    </a>
  );
}

export function SidebarSponsorPlacements({
  placements,
}: {
  placements: SponsorPlacement[];
}) {
  const slots = Array.from(
    { length: 3 },
    (_, index) => placements[index] ?? null,
  );

  return (
    <>
      {slots.map((placement, index) =>
        placement ? (
          <SponsorCard key={placement.id} placement={placement} />
        ) : (
          <EmptySponsorSlot key={`empty-sponsor-${index}`} />
        ),
      )}
    </>
  );
}
