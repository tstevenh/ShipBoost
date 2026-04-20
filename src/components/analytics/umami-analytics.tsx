import Script from "next/script";

const UMAMI_SCRIPT_SRC = "https://cloud.umami.is/script.js";
const UMAMI_WEBSITE_ID = "e2e4ccdc-5104-47ff-8709-a85720901bf5";

export function UmamiAnalytics() {
  return (
    <Script
      id="umami-analytics"
      src={UMAMI_SCRIPT_SRC}
      data-website-id={UMAMI_WEBSITE_ID}
      strategy="beforeInteractive"
    />
  );
}
