"use client";

import * as React from "react";
import { Search } from "lucide-react";

export function Hero() {
  return (
    <section className="pt-20 pb-16 px-6 overflow-hidden relative">
      {/* Background decoration (Subtle gradients common in clones) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full -z-10 opacity-50" />
      
      <div className="container mx-auto max-w-4xl text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full border border-border text-[10px] font-bold tracking-widest  text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          The best tools, everyday
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          Curated collection of <br />
          <span className="text-primary">the best tools.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
          Discover the latest and most useful tools for your next project. 
          Voted by the community, vetted by humans.
        </p>
        
        <div className="max-w-2xl mx-auto relative group animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="absolute inset-0 bg-primary/10 blur-2xl group-focus-within:bg-primary/20 transition-all rounded-2xl" />
          <div className="relative flex items-center bg-card border border-border rounded-2xl shadow-2xl shadow-black/5 overflow-hidden transition-all group-focus-within:border-primary/50 group-focus-within:ring-4 group-focus-within:ring-primary/5">
            <div className="pl-6 text-muted-foreground">
              <Search className="w-6 h-6" />
            </div>
            <input
              type="text"
              placeholder="Search for tools, categories, alternatives..."
              className="w-full bg-transparent border-none outline-none px-4 py-6 text-lg font-medium text-foreground placeholder:text-muted-foreground/50"
            />
            <div className="pr-4 hidden sm:block">
              <kbd className="px-2 py-1 bg-muted border border-border rounded text-[10px] font-bold text-muted-foreground">
                ⌘ K
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
