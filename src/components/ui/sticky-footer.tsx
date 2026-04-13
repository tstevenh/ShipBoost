'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface FooterLink {
	title: string;
	href: string;
}
interface FooterLinkGroup {
	label: string;
	links: FooterLink[];
}

type StickyFooterProps = React.ComponentProps<'footer'>;

export function StickyFooter({ className, ...props }: StickyFooterProps) {
	return (
		<footer
			className={cn('relative w-full border-t border-border bg-background', className)}
			{...props}
		>
      <div className="relative flex size-full flex-col justify-between gap-5 px-4 py-16 md:px-12">
        <div
          aria-hidden
          className="absolute inset-0 isolate z-0 contain-strict pointer-events-none"
        >
          <div className="bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,theme(colors.primary.DEFAULT/.04)_0,transparent_100%)] absolute top-0 left-0 h-full w-full opacity-50" />
        </div>
        
        <div className="relative z-10 mt-10 flex flex-col gap-12 md:flex-row xl:mt-0 max-w-7xl mx-auto w-full">
          <div className="w-full max-w-sm space-y-6">
            <div className="flex items-center gap-2 group">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground transition-transform group-hover:scale-105">
                S
              </span>
              <span className="text-xl font-black tracking-tight text-foreground ">
                ShipBoost
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              The launch and distribution platform for serious bootstrapped SaaS founders. 
              Launch smarter. Get distributed.
            </p>
          </div>

          {footerLinkGroups.map((group) => (
            <div
              key={group.label}
              className="w-full"
            >
              <div className="mb-10 md:mb-0">
                <h3 className="text-[10px] font-black  tracking-[0.2em] text-foreground mb-6">{group.label}</h3>
                <ul className="text-muted-foreground space-y-3 text-sm">
                  {group.links.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="hover:text-primary inline-flex items-center transition-all duration-300 font-medium"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full text-muted-foreground flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs font-bold  tracking-widest md:flex-row">
          <p>© {new Date().getFullYear()} ShipBoost. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="#" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
		</footer>
	);
}

const footerLinkGroups: FooterLinkGroup[] = [
	{
		label: 'Product',
		links: [
			{ title: 'Explore', href: '#' },
			{ title: 'Pricing', href: '#' },
			{ title: 'Submit Tool', href: '#' },
			{ title: 'Featured Slots', href: '#' },
      { title: 'Launch Board', href: '#' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'About Us', href: '#' },
			{ title: 'Brand Guide', href: '#' },
			{ title: 'Contact', href: '#' },
			{ title: 'Support', href: '#' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Blog', href: '#' },
			{ title: 'Changelog', href: '#' },
			{ title: 'Documentation', href: '#' },
			{ title: 'Community', href: '#' },
		],
	},
];
