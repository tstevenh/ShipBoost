import type { Metadata } from "next";
import { Inter, Manrope, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app/app-header";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { getCachedPublicHeaderCategories } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { getDefaultPublicPageImage } from "@/server/seo/page-metadata";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const env = getEnv();
const defaultSocialImage = getDefaultPublicPageImage();

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "ShipBoost | Launch once. Keep getting discovered.",
    template: "%s",
  },
  description:
    "ShipBoost helps bootstrapped SaaS founders turn a launch into long-tail distribution with weekly launch boards, founder-ready listings, and discovery paths that outlive launch day.",
  applicationName: "ShipBoost",
  icons: {
    icon: "/ShipBoost-Logo-BG.svg",
    shortcut: "/ShipBoost-Logo-BG.svg",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "ShipBoost",
    url: env.NEXT_PUBLIC_APP_URL,
    title: "ShipBoost | Launch once. Keep getting discovered.",
    description:
      "ShipBoost helps bootstrapped SaaS founders turn a launch into long-tail distribution with weekly launch boards, founder-ready listings, and discovery paths that outlive launch day.",
    images: [
      {
        url: defaultSocialImage,
        alt: "ShipBoost",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipBoost | Launch once. Keep getting discovered.",
    description:
      "ShipBoost helps bootstrapped SaaS founders turn a launch into long-tail distribution with weekly launch boards, founder-ready listings, and discovery paths that outlive launch day.",
    images: [defaultSocialImage],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerCategories = await getCachedPublicHeaderCategories();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300" suppressHydrationWarning>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppHeader categories={headerCategories.slice(0, 6)} />
          <main className="flex-1 flex flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
