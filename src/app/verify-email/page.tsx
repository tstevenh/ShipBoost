import { redirect } from "next/navigation";

import { VerifyEmailPanel } from "@/components/auth/verify-email-panel";
import { getServerSession } from "@/server/auth/session";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const session = await getServerSession();

  if (session?.user.emailVerified) {
    redirect("/dashboard");
  }

  const { email } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-16 sm:py-20">
      <VerifyEmailPanel initialEmail={email} />
    </div>
  );
}
