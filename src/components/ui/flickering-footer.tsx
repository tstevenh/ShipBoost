import { ChevronRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";

import { FlickeringGridLogo } from "@/components/ui/flickering-grid-logo";
import { cn } from "@/lib/utils";

const siteConfig = {
  hero: {
    description:
      "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and real distribution — not vanity launches.",
  },
  footerLinks: [
    {
      title: "Categories",
      links: [
        { id: 1, title: "Marketing", url: "/categories/marketing" },
        { id: 2, title: "Sales", url: "/categories/sales" },
        { id: 3, title: "Analytics", url: "/categories/analytics" },
        { id: 4, title: "Development", url: "/categories/development" },
        { id: 5, title: "Support", url: "/categories/support" },
        { id: 6, title: "View all", url: "/categories" },
      ],
    },
    {
      title: "Alternatives",
      links: [
        { id: 7, title: "ShipFast Alternatives", url: "/alternatives/shipfast" },
        { id: 8, title: "DirStarter Alternatives", url: "/alternatives/dirstarter" },
        { id: 9, title: "Tapfiliate Alternatives", url: "/alternatives/tapfiliate" },
        { id: 10, title: "Frase Alternatives", url: "/alternatives/frase" },
        { id: 11, title: "Vista Social Alternatives", url: "/alternatives/vista-social" },
        { id: 12, title: "Browse all", url: "/alternatives" },
      ],
    },
    {
      title: "Best Tags",
      links: [
        { id: 13, title: "AI-Powered", url: "/best/tag/ai" },
        { id: 14, title: "Open Source", url: "/best/tag/open-source" },
        { id: 15, title: "Bootstrapped", url: "/best/tag/bootstrapped" },
        { id: 16, title: "Next.js Boilerplates", url: "/best/tag/nextjs" },
        { id: 17, title: "Indie Hackers", url: "/best/tag/indie-hackers" },
        { id: 18, title: "View all", url: "/tags" },
      ],
    },
    {
      title: "Company",
      links: [
        { id: 19, title: "About", url: "/about" },
        { id: 20, title: "Pricing", url: "/pricing" },
        { id: 21, title: "Submit Product", url: "/submit" },
        { id: 22, title: "How It Works", url: "/how-it-works" },
        { id: 23, title: "Launch Guide", url: "/launch-guide" },
        { id: 24, title: "FAQs", url: "/faqs" },
        { id: 25, title: "Contact", url: "/contact" },
      ],
    },
  ],
};

function FooterLogo() {
  return (
    <div className="flex items-center gap-4 group h-14">
      <div className="relative h-14 w-14 shrink-0">
        <Image
          src="/logos/logo-black.png"
          alt=""
          fill
          sizes="56px"
          className="object-contain block dark:hidden transition-transform group-hover:scale-110"
        />
        <Image
          src="/logos/logo-white.png"
          alt=""
          fill
          sizes="56px"
          className="object-contain hidden dark:block transition-transform group-hover:scale-110"
        />
      </div>
      <span className="text-3xl font-black tracking-tighter text-foreground font-heading leading-none">
        ShipBoost
      </span>
    </div>
  );
}

type FlickeringFooterProps = {
  className?: string;
} & Omit<React.ComponentProps<"footer">, "children">;

export function FlickeringFooter({ className, ...props }: FlickeringFooterProps) {
  return (
    <footer
      id="footer"
      className={cn("w-full pb-0 border-t border-border bg-background", className)}
      {...props}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between p-10 max-w-7xl mx-auto">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <Link href="/">
            <FooterLogo />
          </Link>
          <p className="text-sm tracking-tight text-muted-foreground font-medium leading-relaxed">
            {siteConfig.hero.description}
          </p>
        </div>
        <div className="pt-5 md:pt-0 md:w-2/3 lg:w-3/4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:pl-10">
            {siteConfig.footerLinks.map((column) => (
              <ul key={column.title} className="flex flex-col gap-y-2">
                <li className="mb-2 text-[10px] font-black tracking-widest text-foreground/70">
                  {column.title}
                </li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Link href={link.url}>{link.title}</Link>
                    <div className="flex size-3 items-center justify-center border border-border rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                      <ChevronRightIcon className="h-3 w-3 " />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-48 md:h-64 relative mt-12 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-background z-10 from-40%" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGridLogo />
        </div>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 border-t border-border bg-muted/30 p-6 relative z-20 sm:flex-row sm:gap-4">
        <p className="text-muted-foreground text-[10px] font-bold tracking-widest">
          © {new Date().getFullYear()} ShipBoost. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/affiliate" className="hover:text-foreground transition-colors">
            Affiliate
          </Link>
        </div>
      </div>
    </footer>
  );
}
