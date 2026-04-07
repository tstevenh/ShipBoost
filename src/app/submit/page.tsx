import { redirect } from "next/navigation";

import { SubmitProductForm } from "@/components/founder/submit-product-form";
import { getServerSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { listCategories, listTags } from "@/server/services/catalog-service";

export default async function SubmitPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  const env = getEnv();
  const [categories, tags] = await Promise.all([listCategories(), listTags()]);

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-16 sm:py-20">
      <SubmitProductForm
        categories={categories}
        tags={tags}
        appUrl={env.NEXT_PUBLIC_APP_URL}
        founderEmail={session.user.email}
        supportEmail={env.RESEND_REPLY_TO_TRANSACTIONAL ?? session.user.email}
      />
    </section>
  );
}
