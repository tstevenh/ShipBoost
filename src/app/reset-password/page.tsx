import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getServerSession } from "@/server/auth/session";

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  if (error === "INVALID_TOKEN" || error === "invalid_token") {
    return "This reset link is invalid or expired. Request a fresh password reset email.";
  }

  return "This reset link is not usable. Request a fresh password reset email.";
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  const { token, error } = await searchParams;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-16 sm:py-20">
      <ResetPasswordForm token={token} initialError={getErrorMessage(error)} />
    </div>
  );
}
