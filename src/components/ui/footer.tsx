import React from 'react';
import { FlickeringFooter } from './flickering-footer';

type FooterProps = React.ComponentProps<'footer'>;

export function Footer({ className, ...props }: Omit<FooterProps, 'children'>) {
	return <FlickeringFooter className={className} {...props} />;
}
