import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { getServerSession } from "@/server/auth/session";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function ForgotPasswordPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-16 sm:py-20">
      <ForgotPasswordForm />
    </div>
  );
}
