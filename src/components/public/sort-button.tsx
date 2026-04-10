"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListFilter, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Top Voted", value: "top" },
];

export function SortButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") || "newest";
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    router.push(`?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const activeLabel = sortOptions.find(opt => opt.value === currentSort)?.label || "Newest";

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-card border border-border rounded-xl w-fit shadow-sm hover:border-primary/30 transition-colors group"
      >
        <ListFilter size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-sm font-bold">{activeLabel}</span>
        <ChevronDown size={14} className={cn("text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSort(option.value)}
              className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium hover:bg-muted transition-colors text-left"
            >
              {option.label}
              {currentSort === option.value && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
