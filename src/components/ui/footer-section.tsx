'use client';
import React from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface FooterLink {
	title: string;
	href: string;
}

interface FooterSection {
	label: string;
	links: FooterLink[];
}

const footerLinks: FooterSection[] = [
	{
		label: 'Product',
		links: [
			{ title: 'Explore', href: '#link' },
			{ title: 'Pricing', href: '#link' },
			{ title: 'Submit Tool', href: '#link' },
			{ title: 'Premium Launch', href: '#link' },
		],
	},
	{
		label: 'Company',
		links: [
			{ title: 'About ShipBoost', href: '#link' },
			{ title: 'Privacy Policy', href: '#link' },
			{ title: 'Terms of Service', href: '#link' },
			{ title: 'Contact', href: '#link' },
		],
	},
	{
		label: 'Resources',
		links: [
			{ title: 'Blog', href: '#link' },
			{ title: 'Changelog', href: '#link' },
			{ title: 'Brand Guide', href: '#link' },
			{ title: 'Support', href: '#link' },
		],
	},
	{
		label: 'Social',
		links: [
			{ title: 'Twitter / X', href: '#' },
			{ title: 'Instagram', href: '#' },
			{ title: 'LinkedIn', href: '#' },
			{ title: 'Youtube', href: '#' },
		],
	},
];

export function Footer() {
	return (
		<footer className="md:rounded-t-[3rem] relative w-full max-w-7xl mx-auto flex flex-col items-center justify-center rounded-t-3xl border border-b-0 bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.primary/5%),transparent)] px-6 py-12 lg:py-24 mt-20">
			<div className="bg-primary/20 absolute top-0 right-1/2 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

			<div className="grid w-full gap-12 xl:grid-cols-3 xl:gap-8">
				<AnimatedContainer className="space-y-6">
					<div className="flex items-center gap-2 group">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-black text-primary-foreground transition-transform group-hover:scale-105">
              S
            </span>
            <span className="text-xl font-black tracking-tight text-foreground ">
              ShipBoost
            </span>
          </div>
					<p className="text-muted-foreground mt-8 text-sm max-w-xs leading-relaxed">
						The launch and distribution platform for bootstrapped SaaS founders. Launch smarter. Get distributed.
					</p>
          <p className="text-muted-foreground text-xs">
						© {new Date().getFullYear()} ShipBoost. All rights reserved.
					</p>
				</AnimatedContainer>

				<div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4 xl:col-span-2 xl:mt-0">
					{footerLinks.map((section, index) => (
						<AnimatedContainer key={section.label} delay={0.1 + index * 0.1}>
							<div className="mb-10 md:mb-0">
								<h3 className="text-[10px] font-black  tracking-widest text-foreground">{section.label}</h3>
								<ul className="text-muted-foreground mt-6 space-y-3 text-sm">
									{section.links.map((link) => (
										<li key={link.title}>
											<a
												href={link.href}
												className="hover:text-primary inline-flex items-center transition-all duration-300 font-medium"
											>
												{link.title}
											</a>
										</li>
									))}
								</ul>
							</div>
						</AnimatedContainer>
					))}
				</div>
			</div>
		</footer>
	);
};

type ViewAnimationProps = {
	delay?: number;
	className?: ComponentProps<typeof motion.div>['className'];
	children: ReactNode;
};

function AnimatedContainer({ className, delay = 0.1, children }: ViewAnimationProps) {
	const shouldReduceMotion = useReducedMotion();

	if (shouldReduceMotion) {
		return <div className={className}>{children}</div>;
	}

	return (
		<motion.div
			initial={{ filter: 'blur(4px)', translateY: -8, opacity: 0 }}
			whileInView={{ filter: 'blur(0px)', translateY: 0, opacity: 1 }}
			viewport={{ once: true }}
			transition={{ delay, duration: 0.8 }}
			className={className}
		>
			{children}
		</motion.div>
	);
};
