"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";

import type { PublicToolSearchResult } from "@/server/services/tool-service";
import { cn } from "@/lib/utils";

const MIN_QUERY_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 250;

export function HomeSearchModal({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const normalizedInitialQuery = useMemo(
    () => (searchParams.get("q") ?? "").trim(),
    [searchParams],
  );
  const [isOpen, setIsOpen] = useState(normalizedInitialQuery.length >= MIN_QUERY_LENGTH);
  const [query, setQuery] = useState(normalizedInitialQuery);
  const [results, setResults] = useState<PublicToolSearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    normalizedInitialQuery.length >= MIN_QUERY_LENGTH ? "loading" : "idle",
  );
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setQuery(normalizedInitialQuery);
    setIsOpen(normalizedInitialQuery.length >= MIN_QUERY_LENGTH);
    setStatus(normalizedInitialQuery.length >= MIN_QUERY_LENGTH ? "loading" : "idle");
  }, [normalizedInitialQuery]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Small delay to ensure input is rendered in Portal
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => clearTimeout(timer);
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
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K or Ctrl+K
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen(true);
      }
      
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const contextualLabel = (tool: PublicToolSearchResult) => {
    if (tool.categories[0]) {
      return tool.categories[0].name;
    }

    if (tool.tags[0]) {
      return tool.tags[0].name;
    }

    return null;
  };

  const modalContent = isOpen ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md px-6 py-16"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <h2 className="text-sm font-bold tracking-tight text-muted-foreground ">
            Product Search
          </h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            Esc
          </button>
        </div>

        <div className="p-6">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find tools, categories, or tags..."
            className="w-full rounded-xl border border-border bg-background px-4 py-4 text-lg font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
          />

          <div className="mt-6 max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {status === "idle" ? (
              <p className="py-8 text-center text-sm font-medium text-muted-foreground">
                Start typing to explore the directory.
              </p>
            ) : null}

            {status === "loading" ? (
              <div className="flex flex-col items-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="mt-4 text-sm font-medium text-muted-foreground">Searching for products...</p>
              </div>
            ) : null}

            {status === "error" ? (
              <p className="py-8 text-center text-sm font-bold text-destructive">
                Search is temporarily unavailable.
              </p>
            ) : null}

            {status === "done" && results.length === 0 ? (
              <p className="py-8 text-center text-sm font-medium text-muted-foreground">
                No matching products found.
              </p>
            ) : null}

            {results.map((tool) => {
              const label = contextualLabel(tool);

              return (
                <Link
                  key={tool.id}
                  href={`/tools/${tool.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="group block rounded-xl border border-transparent bg-muted/30 p-4 transition-all hover:border-primary/20 hover:bg-primary/5"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-background border border-border">
                      {tool.logoUrl ? (
                        <div className="relative h-full w-full">
                          <Image
                            src={tool.logoUrl}
                            alt={`${tool.name} logo`}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-bold text-muted-foreground">
                          {tool.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-foreground group-hover:text-primary transition-colors">
                          {tool.name}
                        </p>
                        {tool.isFeatured ? (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            Premium
                          </span>
                        ) : null}
                        {label ? (
                          <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            {label}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
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
    </div>
  ) : null;

  return (
    <>
      <div
        className={cn(
          "w-full max-w-full rounded-xl border border-border bg-card p-1.5 shadow-sm xl:max-w-[250px]",
          className,
        )}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-muted-foreground transition-colors hover:bg-accent"
          aria-label="Open search"
        >
          <span className="truncate text-xs font-bold">Search products</span>
          <span className="shrink-0 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-muted-foreground ">
            ⌘ K
          </span>
        </button>
      </div>

      {mounted ? createPortal(modalContent, document.body) : null}
    </>
  );
}
