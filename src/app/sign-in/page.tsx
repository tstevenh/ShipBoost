import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getServerSession } from "@/server/auth/session";

function getNoticeMessage(params: { reset?: string; verified?: string }) {
  if (params.reset) {
    return "Password updated. Sign in with your new password.";
  }

  if (params.verified) {
    return "Email verified. You can sign in now.";
  }

  return null;
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string; verified?: string }>;
}) {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  const params = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-16 sm:py-20">
      <AuthForm mode="sign-in" initialNotice={getNoticeMessage(params)} />
    </div>
  );
}
