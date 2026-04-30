"use client";

import Link from "next/link";

import type { SponsorPlacement } from "@/components/admin/admin-console-shared";

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString();
}

export function SponsorPlacementPanel({
  placements,
  error,
  onDisable,
  isActionPending,
}: {
  placements: SponsorPlacement[];
  error: string | null;
  onDisable: (placementId: string) => void;
  isActionPending: (action: string) => boolean;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-tight">
            Sponsor placements
          </h2>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            Manage paid left-sidebar placements.
          </p>
        </div>
        <Link
          href="/advertise"
          className="rounded-full border border-border px-3 py-1.5 text-[10px] font-black tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          Public page
        </Link>
      </div>

      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold text-destructive">
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Tool</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Ends</th>
              <th className="px-3 py-2">Checkout</th>
              <th className="px-3 py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {placements.map((placement) => (
              <tr key={placement.id} className="border-t border-border">
                <td className="px-3 py-3">
                  <Link
                    href={`/tools/${placement.tool.slug}`}
                    className="font-black text-foreground hover:underline"
                  >
                    {placement.tool.name}
                  </Link>
                </td>
                <td className="px-3 py-3 text-muted-foreground">
                  {placement.tool.owner?.email ?? "No owner"}
                </td>
                <td className="px-3 py-3 font-black">{placement.status}</td>
                <td className="px-3 py-3 text-muted-foreground">
                  {formatDate(placement.endsAt)}
                </td>
                <td className="max-w-[190px] truncate px-3 py-3 text-muted-foreground">
                  {placement.checkoutSessionId ?? "-"}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    disabled={
                      placement.status === "DISABLED" ||
                      isActionPending(`sponsor-disable:${placement.id}`)
                    }
                    onClick={() => onDisable(placement.id)}
                    className="rounded-lg border border-border px-3 py-1 font-black text-destructive disabled:opacity-40"
                  >
                    Disable
                  </button>
                </td>
              </tr>
            ))}
            {placements.length === 0 ? (
              <tr className="border-t border-border">
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-sm font-semibold text-muted-foreground"
                >
                  No sponsor placements yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
