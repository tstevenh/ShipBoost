"use client";

import Link from "next/link";
import { Suspense } from "react";
import { 
  Rocket, ArrowRight, ShieldCheck, 
  Zap, Star, Sparkles, Layout,
  Search, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HomeLeadMagnetForm } from "./home-lead-magnet-form";

type PrelaunchTool = {
  id: string;
  name: string;
  tagline: string;
  slug: string;
  logoUrl?: string | null;
};

export function PrelaunchSurface({ tools }: { tools: PrelaunchTool[] }) {
  return (
    <div className="space-y-24 animate-in fade-in duration-700">
      {/* Primary Goal: Lead Magnet */}
      <Suspense
        fallback={<div className="min-h-[280px] rounded-3xl border border-border bg-card shadow-sm" />}
      >
        <HomeLeadMagnetForm />
      </Suspense>

      {/* Secondary Goal: Founder Conversion */}
      <section className="grid gap-12 lg:grid-cols-[1fr_400px] items-start">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 uppercase">
              Founder Opportunity
            </p>
            <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lowercase">
              Secure your Day 1 launch slot.
            </h2>
            <p className="text-xl font-medium leading-relaxed text-muted-foreground/80 max-w-2xl">
              We are currently in private beta, curating the opening cohort of launches. 
              Submit your product today to get priority scheduling and verified founder 
              status when we go public.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/submit"
              className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:opacity-90 transition-all active:scale-95 group"
            >
              <Rocket size={18} />
              Schedule your launch
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              href="/pricing"
              className="inline-flex items-center justify-center gap-3 border border-border bg-card px-8 py-4 rounded-2xl font-black text-sm hover:bg-muted transition-all active:scale-95"
            >
              View launch paths
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4">
            {[
              { icon: ShieldCheck, label: "Verified Founder" },
              { icon: Zap, label: "Priority Queue" },
              { icon: Star, label: "Featured Perks" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <item.icon size={16} className="text-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-border bg-card p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
            <Sparkles size={16} /> Why launch here?
          </h3>
          <ul className="space-y-5">
            {[
              { t: "Editorial Quality", d: "No spam. Every listing is reviewed for quality and founder credibility." },
              { t: "Real Distribution", d: "We push your product to a curated list of operators and early adopters." },
              { t: "Monochrome Focus", d: "High-contrast design that puts your product logo and copy center stage." }
            ].map((item, i) => (
              <li key={i} className="space-y-1">
                <h4 className="text-sm font-black text-foreground lowercase">{item.t}</h4>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">{item.d}</p>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* Credibility: Seeded Tools Preview */}
      {tools.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-end justify-between px-2">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 uppercase">
                Directory Preview
              </p>
              <h2 className="text-3xl font-black tracking-tight lowercase">Joining elite company.</h2>
            </div>
            <Link href="/categories" className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
              Explore categories →
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {tools.map((tool) => (
              <Link 
                key={tool.id} 
                href={`/tools/${tool.slug}`}
                className="group flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-all hover:shadow-lg hover:shadow-black/5"
              >
                <div className="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {tool.logoUrl ? (
                    <img src={tool.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-black text-muted-foreground/40">{tool.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black text-foreground group-hover:opacity-70 transition-opacity truncate">{tool.name}</h3>
                  <p className="text-xs font-medium text-muted-foreground line-clamp-1">{tool.tagline}</p>
                </div>
                <ExternalLink size={14} className="text-muted-foreground group-hover:text-foreground transition-colors mr-2" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
