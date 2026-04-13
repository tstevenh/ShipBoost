import type { Metadata } from "next";
import { Inter, Manrope, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app/app-header";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { getCachedPublicHeaderCategories } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
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

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: {
    default: "ShipBoost | Launch smarter. Get distributed.",
    template: "%s",
  },
  description: "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and momentum through curated distribution.",
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
    title: "ShipBoost | Launch smarter. Get distributed.",
    description:
      "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and momentum through curated distribution.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ShipBoost | Launch smarter. Get distributed.",
    description:
      "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and momentum through curated distribution.",
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
        <GoogleAnalytics />
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
