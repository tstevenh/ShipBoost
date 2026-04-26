import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";
import { getEnv } from "@/server/env";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const env = getEnv();
  const params = await searchParams;
  const redirectTo = params.redirect || "/dashboard";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 px-6 py-16 sm:py-20">
      <AuthForm
        mode="sign-up"
        redirectTo={redirectTo}
        googleEnabled={Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)}
      />
    </div>
  );
}
