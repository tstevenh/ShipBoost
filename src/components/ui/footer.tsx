import React from 'react';
import { FlickeringFooter } from './flickering-footer';

type FooterProps = React.ComponentProps<'footer'> & {
	hideFeaturedBadgeRail?: boolean;
};

export function Footer({ className, hideFeaturedBadgeRail = false, ...props }: Omit<FooterProps, 'children'>) {
	return <FlickeringFooter className={className} hideFeaturedBadgeRail={hideFeaturedBadgeRail} {...props} />;
}
