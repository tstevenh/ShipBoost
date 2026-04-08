import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getServerSession } from "@/server/auth/session";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const session = await getServerSession();
  const params = await searchParams;
  const redirectTo = params.redirect || "/dashboard";

  if (session) {
    redirect(redirectTo);
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-16 sm:py-20">
      <AuthForm mode="sign-up" redirectTo={redirectTo} />
    </div>
  );
}
