"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

const menuItems = [
  { name: "Explore", href: "#link" },
  { name: "Pricing", href: "#link" },
  { name: "About", href: "#link" },
];

export function Header() {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed z-50 w-full px-2 group top-0 left-0 right-0"
      >
        <div
          className={cn(
            "mx-auto mt-2 max-w-7xl px-6 transition-all duration-300 lg:px-12",
            isScrolled &&
              "bg-background/80 max-w-5xl rounded-2xl border border-border backdrop-blur-lg lg:px-5 shadow-xl shadow-foreground/5"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link
                href="/"
                aria-label="home"
                className="flex items-center gap-2.5 group"
              >
                <Logo />
              </Link>

              <div className="flex items-center gap-2 lg:hidden">
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="p-2 text-muted-foreground"
                >
                  {mounted && resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button
                  onClick={() => setMenuState(!menuState)}
                  aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                  className="relative z-20 -m-2.5 p-2.5"
                >
                  <Menu className={cn("m-auto size-6 duration-200", menuState && "rotate-180 scale-0 opacity-0")} />
                  <X className={cn("absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200", menuState && "rotate-0 scale-100 opacity-100")} />
                </button>
              </div>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-10 text-sm font-bold tracking-tight">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <span>{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className={cn(
              "bg-background mb-6 w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-border p-6 shadow-2xl shadow-zinc-300/20 lg:m-0 lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent",
              menuState ? "flex" : "hidden lg:flex"
            )}>
              <div className="lg:hidden w-full">
                <ul className="space-y-6 text-base font-bold">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-4 sm:space-y-0 md:w-fit items-center">
                <button
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="hidden lg:block p-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  {mounted && resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <Link
                  href="/login"
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign in
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="font-bold rounded-lg px-5 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95"
                >
                  <Link href="#">
                    <span>Submit product</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

const Logo = () => {
  return (
    <div className="flex items-center gap-2 group">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground transition-transform group-hover:scale-105">
        S
      </span>
      <span className="text-xl font-black tracking-tight text-foreground ">
        ShipBoost
      </span>
    </div>
  );
};
