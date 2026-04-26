"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isAuthRoutePathname } from "@/lib/route-groups";

const UMAMI_SCRIPT_ID = "umami-analytics";
const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = "e2e4ccdc-5104-47ff-8709-a85720901bf5";

export function UmamiAnalytics() {
  const pathname = usePathname();
  const isAuthRoute = isAuthRoutePathname(pathname);

  useEffect(() => {
    if (isAuthRoute) {
      return;
    }

    if (document.getElementById(UMAMI_SCRIPT_ID)) {
      return;
    }

    const script = document.createElement("script");
    script.id = UMAMI_SCRIPT_ID;
    script.src = UMAMI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.dataset.websiteId = UMAMI_WEBSITE_ID;
    document.head.appendChild(script);
  }, [isAuthRoute]);

  return null;
}
