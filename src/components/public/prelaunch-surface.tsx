"use client";

import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  ExternalLink,
  Layout,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { FrogDrBadge } from "./frog-dr-badge";
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
      <section className="grid gap-12 lg:grid-cols-[1fr_400px] items-start">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 ">
              Prelaunch access
            </p>
            <h2 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl ">
              Reserve a launch week before public opening.
            </h2>
            <p className="text-xl font-medium leading-relaxed text-muted-foreground/80 max-w-2xl">
              ShipBoost opens on May 4, 2026 UTC. Free launches enter weekly
              cohorts. Premium launches can lock a week early and skip badge
              verification.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/submit"
              className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:opacity-90 transition-all active:scale-95 group"
            >
              Start your submission
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-3 border border-border bg-card px-8 py-4 rounded-2xl font-black text-sm hover:bg-muted transition-all active:scale-95"
            >
              View pricing
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4">
            {[
              { icon: ShieldCheck, label: "Free Launch" },
              { icon: Layout, label: "Weekly Cohorts" },
              { icon: Zap, label: "Premium Weeks" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <item.icon size={16} className="text-foreground" />
                <span className="text-[10px] font-black  tracking-widest">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-3xl border border-border bg-card p-8 shadow-sm space-y-6">
          <h3 className="text-xs font-black  tracking-widest text-foreground">
            Why founders start here
          </h3>
          <ul className="space-y-5">
            {[
              { t: "Capped weekly cohorts", d: "Each week is curated and capacity-limited instead of opening as a noisy free-for-all." },
              { t: "Clear launch rules", d: "Free launches are queued. Premium launches reserve a week before go-live." },
              { t: "Trust before traffic", d: "Clean listings and founder signals matter more than vanity spikes." },
            ].map((item, i) => (
              <li key={i} className="space-y-1">
                <h4 className="text-sm font-black text-foreground ">{item.t}</h4>
                <p className="text-xs font-medium text-muted-foreground leading-relaxed">{item.d}</p>
              </li>
            ))}
          </ul>

          <FrogDrBadge className="bg-background" />
        </aside>
      </section>

      <Suspense
        fallback={<div className="min-h-[280px] rounded-3xl border border-border bg-card shadow-sm" />}
      >
        <HomeLeadMagnetForm />
      </Suspense>

      {/* Credibility: Seeded Tools Preview */}
      {tools.length > 0 && (
        <section className="space-y-10">
          <div className="flex items-end justify-between px-2">
            <div className="space-y-2">
              <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 ">
                Directory Preview
              </p>
              <h2 className="text-3xl font-black tracking-tight ">See what makes the cut before launch day.</h2>
            </div>
            <Link href="/categories" className="text-xs font-black text-muted-foreground hover:text-foreground transition-colors  tracking-widest">
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
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={tool.logoUrl} alt={`${tool.name} logo`} className="w-full h-full object-cover" />
                    </>
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
