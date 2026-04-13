import { redirect } from "next/navigation";

export default function DailyLaunchRedirectPage() {
  redirect("/launches/weekly");
}
