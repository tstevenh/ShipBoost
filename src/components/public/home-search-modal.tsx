"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { PublicToolSearchResult } from "@/server/services/tool-service";

type HomeSearchModalProps = {
  initialQuery?: string;
};

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 250;

export function HomeSearchModal({ initialQuery = "" }: HomeSearchModalProps) {
  const normalizedInitialQuery = initialQuery.trim();
  const [isOpen, setIsOpen] = useState(normalizedInitialQuery.length >= MIN_QUERY_LENGTH);
  const [query, setQuery] = useState(normalizedInitialQuery);
  const [results, setResults] = useState<PublicToolSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    normalizedInitialQuery.length >= MIN_QUERY_LENGTH ? "loading" : "idle",
  );
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    setQuery(normalizedInitialQuery);
    setIsOpen(normalizedInitialQuery.length >= MIN_QUERY_LENGTH);
    setStatus(normalizedInitialQuery.length >= MIN_QUERY_LENGTH ? "loading" : "idle");
  }, [normalizedInitialQuery]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextUrl = new URL(window.location.href);

    if (trimmedQuery.length >= MIN_QUERY_LENGTH) {
      nextUrl.searchParams.set("q", trimmedQuery);
    } else {
      nextUrl.searchParams.delete("q");
    }

    window.history.replaceState({}, "", nextUrl);
  }, [trimmedQuery]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || trimmedQuery.length < MIN_QUERY_LENGTH) {
      setStatus("idle");
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus("loading");

      try {
        const response = await fetch(
          `/api/tools/search?q=${encodeURIComponent(trimmedQuery)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Search request failed");
        }

        const payload = (await response.json()) as {
          data: PublicToolSearchResult[];
        };

        setResults(payload.data);
        setStatus("done");
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        setResults([]);
        setStatus("error");
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isOpen, trimmedQuery]);

  const contextualLabel = (tool: PublicToolSearchResult) => {
    if (tool.categories[0]) {
      return tool.categories[0].name;
    }

    if (tool.tags[0]) {
      return tool.tags[0].name;
    }

    return null;
  };

  return (
    <>
      <div className="rounded-[1.75rem] border border-black/10 bg-white/90 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left text-black/55 transition hover:bg-black/[0.03]"
          aria-label="Open search"
        >
          <span>Search published products</span>
          <span className="text-xs font-medium tracking-[0.16em] text-black/40 uppercase">
            Search
          </span>
        </button>
      </div>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-6 py-16"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-[2rem] bg-[#1d1c1a] p-6 text-[#f6e8d4] shadow-[0_28px_90px_rgba(29,28,26,0.4)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-white">
                Search published products
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-sm text-[#f6e8d4]/70 transition hover:text-white"
              >
                Close
              </button>
            </div>

            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search published products"
              className="mt-5 w-full rounded-2xl border border-[#f3c781]/30 bg-transparent px-4 py-3 text-white outline-none placeholder:text-[#f6e8d4]/38"
            />

            <div className="mt-5 space-y-3">
              {status === "idle" ? (
                <p className="text-sm text-[#f6e8d4]/70">
                  Start typing to search published products.
                </p>
              ) : null}

              {status === "loading" ? (
                <p className="text-sm text-[#f6e8d4]/70">Searching...</p>
              ) : null}

              {status === "error" ? (
                <p className="text-sm text-[#f6e8d4]/70">
                  Search is temporarily unavailable.
                </p>
              ) : null}

              {status === "done" && results.length === 0 ? (
                <p className="text-sm text-[#f6e8d4]/70">
                  No matching products found.
                </p>
              ) : null}

              {results.map((tool) => {
                const label = contextualLabel(tool);

                return (
                  <Link
                    key={tool.id}
                    href={`/tools/${tool.slug}`}
                    className="block rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white/10">
                        {tool.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={tool.logoUrl}
                            alt={`${tool.name} logo`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-white/70">
                            {tool.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{tool.name}</p>
                          {tool.isFeatured ? (
                            <span className="rounded-full bg-[#f3c781] px-2 py-0.5 text-[11px] font-semibold text-[#1d1c1a]">
                              Featured
                            </span>
                          ) : null}
                          {label ? (
                            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] font-medium text-[#f6e8d4]/72">
                              {label}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm text-[#f6e8d4]/75">
                          {tool.tagline}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
