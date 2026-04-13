"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqGroup = {
  title: string;
  items: FaqItem[];
};

export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  const [openKey, setOpenKey] = useState("0-0");

  return (
    <div className="space-y-10">
      {groups.map((group, groupIndex) => (
        <section key={group.title} className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-foreground ">
            {group.title}
          </h2>
          <div className="space-y-3">
            {group.items.map((item, itemIndex) => {
              const key = `${groupIndex}-${itemIndex}`;
              const isOpen = openKey === key;

              return (
                <article
                  key={item.question}
                  className="rounded-3xl border border-border bg-card shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? "" : key)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-black text-foreground">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-border px-6 py-5 text-sm font-medium leading-relaxed text-muted-foreground">
                      {item.answer}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
