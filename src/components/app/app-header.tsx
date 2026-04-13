"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import { Menu, X, ChevronDown, Rocket, Tag, Layers, LogOut, User, Hash } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

type AppHeaderCategory = {
  id: string;
  name: string;
  slug: string;
};

function getInitials(name: string | null | undefined) {
  if (!name) {
    return "SB";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppHeader({
  categories,
}: {
  categories: AppHeaderCategory[];
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, startSignOutTransition] = useTransition();
  
  const [menuState, setMenuState] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProductsOpen, setIsProductsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function handleSignOut() {
    startSignOutTransition(() => {
      void (async () => {
        setErrorMessage(null);

        const result = await authClient.signOut();

        if (result.error) {
          setErrorMessage(result.error.message ?? "Unable to sign out right now.");
          return;
        }

        router.push("/");
        router.refresh();
      })();
    });
  }

  const isBusy = isPending || isSigningOut;
  const mobileCategoryLinks = categories.slice(0, 6);

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed top-0 left-0 right-0 z-50 w-full px-2 group"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-7xl px-4 transition-all duration-300 sm:px-6 lg:px-12",
            isScrolled &&
              "bg-background/80 max-w-5xl rounded-2xl border border-border backdrop-blur-lg lg:px-5 shadow-xl shadow-foreground/5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-4 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full min-w-0 justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex min-w-0 items-center gap-3 group h-14 sm:gap-4"
              >
                <div className="relative h-14 w-14 shrink-0">
                  <Image
                    src="/logos/logo-black.png"
                    alt=""
                    fill
                    className="object-contain block dark:hidden transition-transform group-hover:scale-110"
                    priority
                  />
                  <Image
                    src="/logos/logo-white.png"
                    alt=""
                    fill
                    className="object-contain hidden dark:block transition-transform group-hover:scale-110"
                    priority
                  />
                </div>
                <span
                  className="truncate text-2xl font-black tracking-tighter text-foreground font-heading leading-none sm:text-3xl"
                  suppressHydrationWarning
                >
                  ShipBoost
                </span>
              </Link>

              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />
                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState === true ? "Close Menu" : "Open Menu"}
                  className="relative z-20 -m-2.5 p-2.5"
                >
                  <Menu className={cn("m-auto size-6 duration-200", menuState && "rotate-180 scale-0 opacity-0")} />
                  <X className={cn("absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200", menuState && "rotate-0 scale-100 opacity-100")} />
                </button>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm font-bold tracking-tight">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                    Launchpad
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li className="relative group/products">
                  <button 
                    onMouseEnter={() => setIsProductsOpen(true)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Products <ChevronDown size={14} className={cn("transition-transform duration-200", isProductsOpen && "rotate-180")} />
                  </button>
                  
                  {/* Products Dropdown */}
                  <div 
                    onMouseLeave={() => setIsProductsOpen(false)}
                    className={cn(
                      "absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-200",
                      isProductsOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
                    )}
                  >
                    <div className="w-[480px] bg-card border border-border rounded-2xl shadow-2xl p-6 grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black  tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                          <Layers size={12} /> Categories
                        </h3>
                        <div className="grid gap-2">
                          {categories.slice(0, 6).map(cat => (
                            <Link 
                              key={cat.id} 
                              href={`/categories/${cat.slug}`}
                              className="text-sm font-bold text-foreground hover:opacity-70 transition-colors block"
                            >
                              {cat.name}
                            </Link>
                          ))}
                          <Link href="/categories" className="text-xs font-black text-foreground hover:underline pt-1">
                            View all categories →
                          </Link>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <h3 className="text-[10px] font-black  tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                            Explore
                          </h3>
                          <Link href="/tags" className="flex items-center gap-2 text-sm font-bold text-foreground hover:opacity-70 transition-colors block">
                            <Hash size={14} className="text-foreground" /> Tags
                          </Link>
                        </div>
                        
                        <div className="pt-4 border-t border-border">
                          <Link 
                            href="/submit" 
                            className="flex items-center gap-2 text-sm font-black text-foreground hover:opacity-70 transition-colors"
                          >
                            <Rocket size={16} /> Submit your product
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <div className={cn(
              "bg-background mb-6 w-full min-w-0 flex-wrap items-center justify-end space-y-8 rounded-3xl border border-border p-5 shadow-2xl shadow-zinc-300/20 sm:p-6 lg:m-0 lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent",
              menuState ? "flex" : "hidden lg:flex"
            )}>
              <div className="w-full space-y-6 lg:hidden">
                <div className="space-y-2">
                  <Link
                    href="/"
                    onClick={() => setMenuState(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-foreground transition hover:bg-muted"
                  >
                    <span>Launchpad</span>
                    <Rocket size={16} className="text-muted-foreground" />
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setMenuState(false)}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black text-foreground transition hover:bg-muted"
                  >
                    <span>Pricing</span>
                    <Tag size={16} className="text-muted-foreground" />
                  </Link>
                </div>

                <div className="rounded-[1.75rem] border border-border bg-muted/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                    <Layers size={12} />
                    Products
                  </div>
                  <div className="space-y-2">
                    {mobileCategoryLinks.map((category) => (
                      <Link
                        key={category.id}
                        href={`/categories/${category.slug}`}
                        onClick={() => setMenuState(false)}
                        className="block rounded-xl px-3 py-2 text-sm font-bold text-foreground transition hover:bg-background"
                      >
                        {category.name}
                      </Link>
                    ))}
                    <Link
                      href="/categories"
                      onClick={() => setMenuState(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-black text-foreground transition hover:bg-background"
                    >
                      <span>All categories</span>
                      <Layers size={14} className="text-muted-foreground" />
                    </Link>
                    <Link
                      href="/tags"
                      onClick={() => setMenuState(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-black text-foreground transition hover:bg-background"
                    >
                      <span>Tags</span>
                      <Hash size={14} className="text-muted-foreground" />
                    </Link>
                    <Link
                      href="/submit"
                      onClick={() => setMenuState(false)}
                      className="flex items-center justify-between rounded-xl bg-primary px-3 py-2 text-sm font-black text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90"
                    >
                      <span>Submit your product</span>
                      <Rocket size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex w-full flex-col items-stretch space-y-3 sm:flex-row sm:items-center sm:gap-4 sm:space-y-0 md:w-fit">
                <div className="hidden lg:block">
                  <ThemeToggle />
                </div>
                
                {session ? (
                  <div className="flex w-full items-center gap-3 sm:w-auto">
                    <div className="relative group/user">
                      <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex w-full items-center justify-between gap-3 rounded-full border border-border bg-card p-1 pr-3 shadow-sm transition-colors hover:border-foreground/30 sm:w-auto sm:justify-start"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                          {getInitials(session.user.name)}
                        </div>
                        <span className="truncate text-xs font-bold whitespace-nowrap">
                          {session.user.name}
                        </span>
                        <ChevronDown size={12} className="text-muted-foreground" />
                      </button>
                      
                      <div
                        className={cn(
                          "absolute top-full right-0 z-20 mt-2 w-48 rounded-xl border border-border bg-card py-2 shadow-2xl transition-all duration-200",
                          isUserMenuOpen
                            ? "visible translate-y-0 opacity-100"
                            : "invisible translate-y-1 opacity-0",
                          "group-hover/user:visible group-hover/user:translate-y-0 group-hover/user:opacity-100"
                        )}
                      >
                        <Link 
                          href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setMenuState(false);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                        >
                          <User size={14} /> Dashboard
                        </Link>
                        {session.user.role === "ADMIN" && (
                          <Link 
                            href="/admin"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              setMenuState(false);
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                          >
                            <Layers size={14} /> Admin Console
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          disabled={isBusy}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors border-t border-border mt-1 pt-3"
                        >
                          <LogOut size={14} /> {isSigningOut ? "Signing out..." : "Sign out"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/sign-in"
                      onClick={() => setMenuState(false)}
                      className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-primary-foreground shadow-lg shadow-black/10 transition-all hover:opacity-90 active:scale-95 sm:w-auto"
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {errorMessage ? (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] border border-destructive/20 bg-destructive/10 px-6 py-2 rounded-full text-xs font-bold text-destructive  tracking-widest backdrop-blur-md">
          {errorMessage}
        </div>
      ) : null}
    </header>
  );
}
