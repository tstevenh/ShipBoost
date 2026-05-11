import React from 'react';
import { FlickeringFooter } from './flickering-footer';
import { getServerSession } from '@/server/auth/session';

type FooterProps = React.ComponentProps<'footer'> & {
	hideFeaturedBadgeRail?: boolean;
};

export async function Footer({ className, hideFeaturedBadgeRail, ...props }: Omit<FooterProps, 'children'>) {
	// Auto-hide the badge marquee for signed-in users unless the caller explicitly opts in.
	let resolvedHide = hideFeaturedBadgeRail;
	if (resolvedHide === undefined) {
		try {
			const session = await getServerSession();
			resolvedHide = Boolean(session?.user);
		} catch {
			resolvedHide = false;
		}
	}
	return <FlickeringFooter className={className} hideFeaturedBadgeRail={resolvedHide} {...props} />;
}
