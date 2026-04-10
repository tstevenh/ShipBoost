"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { HomeSearchModal } from "./home-search-modal";
import { Rocket } from "lucide-react";

export function SponsorSlot({ className }: { className?: string }) {
  return null;
  /* return (
    <div className={cn("bg-card border border-border rounded-2xl p-5 shadow-sm", className)}>
      <h3 className="font-bold text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-3">
        Sponsored
      </h3>
      <div className="flex gap-4 items-center">
        <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden border border-border flex items-center justify-center shrink-0 group cursor-pointer">
          <div className="w-full h-full bg-muted/50 flex items-center justify-center transition-transform group-hover:scale-110">
             <span className="text-muted-foreground/40 font-black text-[10px]">AD</span>
          </div>
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-xs truncate text-foreground">Boost your SaaS</h4>
          <p className="text-[10px] text-muted-foreground mt-1 leading-tight line-clamp-2">
            Reach thousands of founders and operators.
          </p>
        </div>
      </div>
    </div>
  ); */
}

export function SidebarLeadMagnet() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
      <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-foreground/40 mb-4 relative">
        Free Resource
      </h3>
      <h4 className="font-black text-lg mb-3 relative leading-tight">
        800+ Startup Directories
      </h4>
      <p className="text-xs text-muted-foreground mb-6 leading-relaxed relative">
        Get the list founders use to find submission opportunities.
      </p>
      <form className="space-y-3 relative">
        <input
          type="email"
          placeholder="you@startup.com"
          className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl text-sm font-medium outline-none focus:border-foreground transition-all"
        />
        <button className="w-full py-3 bg-primary text-primary-foreground text-xs font-black rounded-xl shadow-lg shadow-black/10 hover:opacity-90 transition-all active:scale-95">
          Get the list
        </button>
      </form>
    </div>
  );
}

export function ShowcaseLayout({ children, searchParams, isHomePage, isPrelaunch }: { children: React.ReactNode, searchParams?: any, isHomePage?: boolean, isPrelaunch?: boolean }) {
  return (
    <section className={cn("pb-20 bg-muted/20 min-h-screen", isHomePage ? "pt-8" : "pt-24")}>
      <div className="mx-auto max-w-[1600px] px-6">
        <div className={cn(
          "grid grid-cols-1 gap-10 items-start",
          !isPrelaunch && "xl:grid-cols-[300px_1fr_300px]"
        )}>
          
          {/* Left Column: Lead Magnet + Sponsors */}
          {!isPrelaunch && (
            <aside className="hidden xl:flex flex-col gap-4 sticky top-[100px] h-fit self-start">
              <SidebarLeadMagnet />
              <SponsorSlot />
              <SponsorSlot />
              <SponsorSlot />
            </aside>
          )}

          {/* Middle Column */}
          <div className={cn("min-w-0", isPrelaunch && "max-w-5xl mx-auto w-full")}>
            {children}
          </div>

          {/* Right Column: Search + Submit + Sponsors */}
          {!isPrelaunch && (
            <aside className="hidden xl:flex flex-col gap-4 sticky top-[100px] h-fit self-start">
              <HomeSearchModal initialQuery={searchParams?.q} />
              
              <Link 
                href="/submit"
                className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:opacity-90 transition-all active:scale-95 group"
              >
                <Rocket size={18} className="group-hover:translate-y-[-2px] transition-transform" />
                Submit your product
              </Link>

              <SponsorSlot />
              <SponsorSlot />
              <SponsorSlot />
            </aside>
          )}

        </div>
      </div>
    </section>
  );
}
