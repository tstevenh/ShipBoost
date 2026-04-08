import { redirect } from "next/navigation";

import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { getServerSession } from "@/server/auth/session";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; redirect?: string }>;
}) {
  const session = await getServerSession();
  const { email, redirect: redirectTo } = await searchParams;

  if (session?.user.emailVerified) {
    redirect(redirectTo || "/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-16 sm:py-20">
      <VerifyEmailPanel initialEmail={email} redirectTo={redirectTo} />
    </div>
  );
}
