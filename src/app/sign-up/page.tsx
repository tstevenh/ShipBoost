import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/auth-form";
import { getServerSession } from "@/server/auth/session";

export default async function SignUpPage() {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-16 sm:py-20">
      <AuthForm mode="sign-up" />
    </div>
  );
}
