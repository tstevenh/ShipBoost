import { redirect } from "next/navigation";

// The /advertise route is deprecated — sponsorship is now handled entirely
// through the SponsorAdvertiseModal. We keep this route as a redirect so old
// links from emails, the sitemap, and the footer continue to work.
export default function AdvertiseRedirect() {
  redirect("/?advertise=1");
}
