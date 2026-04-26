"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { isAuthRoutePathname } from "@/lib/route-groups";

const GOOGLE_TAG_ID = "G-KP03SBLNHT";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isAuthRoute = isAuthRoutePathname(pathname);

  useEffect(() => {
    if (isAuthRoute) {
      return;
    }

    const analyticsWindow = window as AnalyticsWindow;

    if (!analyticsWindow.gtag) {
      return;
    }

    const search = searchParams.toString();
    const pagePath = search ? `${pathname}?${search}` : pathname;

    analyticsWindow.gtag("config", GOOGLE_TAG_ID, {
      page_path: pagePath,
    });
  }, [isAuthRoute, pathname, searchParams]);

  if (isAuthRoute) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_TAG_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GOOGLE_TAG_ID}');
        `}
      </Script>
    </>
  );
}
