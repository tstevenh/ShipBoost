import type { Metadata } from "next";
import { Inter, Manrope, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app/app-header";
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

export const metadata: Metadata = {
  title: "ShipBoost | Launch smarter. Get distributed.",
  description: "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and momentum through curated distribution.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AppHeader />
          <main className="flex-1 flex flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
