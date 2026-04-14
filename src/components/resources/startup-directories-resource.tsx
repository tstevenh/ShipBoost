"use client";

import { useState } from "react";

import { startupDirectories } from "@/content/resources/startup-directories";

type SortKey = "name" | "domain" | "dr";
type SortDirection = "asc" | "desc";
type StartupDirectoriesResourceProps = {
  preview?: boolean;
};

const collator = new Intl.Collator(undefined, {
  sensitivity: "base",
  numeric: true,
});

function sortDirectories(
  items: typeof startupDirectories,
  sortKey: SortKey,
  sortDirection: SortDirection,
) {
  const sorted = [...items];

  sorted.sort((left, right) => {
    const comparison =
      sortKey === "dr"
        ? left.dr - right.dr
        : collator.compare(left[sortKey], right[sortKey]);

    if (comparison !== 0) {
      return sortDirection === "asc" ? comparison : -comparison;
    }

    return collator.compare(left.name, right.name);
  });

  return sorted;
}

export function StartupDirectoriesResource({
  preview = false,
}: StartupDirectoriesResourceProps) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("dr");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sourceRows = preview
    ? startupDirectories.filter((item) => item.domain !== "reddit.com")
    : startupDirectories;

  const filtered = sourceRows.filter((item) =>
    item.searchText.includes(query.trim().toLowerCase()),
  );
  const visibleRows = sortDirectories(filtered, sortKey, sortDirection).slice(
    0,
    preview ? 12 : undefined,
  );

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "dr" ? "desc" : "asc");
  }

  function getAriaSort(column: SortKey) {
    if (column !== sortKey) {
      return "none";
    }

    return sortDirection === "asc" ? "ascending" : "descending";
  }

  function renderSortIcon(column: SortKey) {
    if (column !== sortKey) {
      return (
        <span
          aria-hidden="true"
          className="ml-1 text-[11px] font-black tracking-tight text-muted-foreground/40"
        >
          ↑↓
        </span>
      );
    }

    return (
      <span
        aria-hidden="true"
        className="ml-1 text-[11px] font-black tracking-tight text-foreground"
      >
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      {!preview ? (
        <div className="max-w-xl">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, domain, or URL"
            className="w-full rounded-2xl border border-border bg-card px-5 py-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
          />
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-3xl border border-border bg-card">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-3 font-black text-foreground">#</th>
              <th className="px-4 py-3 font-black text-foreground" aria-sort={getAriaSort("name")}>
                <button
                  type="button"
                  onClick={() => handleSort("name")}
                  className="whitespace-nowrap"
                >
                  Name
                  {renderSortIcon("name")}
                  <span className="sr-only"> sort by name</span>
                </button>
              </th>
              <th className="px-4 py-3 font-black text-foreground" aria-sort={getAriaSort("domain")}>
                <button
                  type="button"
                  onClick={() => handleSort("domain")}
                  className="whitespace-nowrap"
                >
                  Domain
                  {renderSortIcon("domain")}
                  <span className="sr-only"> sort by domain</span>
                </button>
              </th>
              <th className="px-4 py-3 font-black text-foreground" aria-sort={getAriaSort("dr")}>
                <button
                  type="button"
                  onClick={() => handleSort("dr")}
                  className="whitespace-nowrap"
                >
                  DR
                  {renderSortIcon("dr")}
                  <span className="sr-only"> sort by dr</span>
                </button>
              </th>
              <th className="px-4 py-3 font-black text-foreground">Visit</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((item, index) => (
              <tr
                key={item.id}
                className={`border-t border-border align-middle ${
                  item.recommended ? "bg-primary/[0.045]" : ""
                }`}
              >
                <td className={`px-4 py-3 ${item.recommended ? "font-black text-foreground" : "text-muted-foreground"}`}>
                  {index + 1}
                </td>
                <td className="px-4 py-3 font-bold text-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{item.name}</span>
                    {item.recommended ? (
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                        ShipBoost
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className={`px-4 py-3 ${item.recommended ? "font-semibold text-foreground/80" : "text-muted-foreground"}`}>
                  {item.domain}
                </td>
                <td className="px-4 py-3 font-bold text-foreground">{item.dr}</td>
                <td className="px-4 py-3">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 text-xs font-black transition-colors ${
                      item.recommended
                        ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                        : "border-border hover:bg-muted"
                    }`}
                  >
                    Visit
                  </a>
                </td>
              </tr>
            ))}

            {visibleRows.length === 0 ? (
              <tr className="border-t border-border">
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm font-medium text-muted-foreground"
                >
                  No directories match that search.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
