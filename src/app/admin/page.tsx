import { redirect } from "next/navigation";

import { AdminConsole } from "@/components/admin/admin-console";
import { getServerSession } from "@/server/auth/session";

export default async function AdminPage() {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="mb-8 rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
          Admin access confirmed
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
          Shipboost moderation console
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-black/68">
          This interface now sits on top of the protected admin API. Use it to
          process founder submissions, seed listings, and keep the catalog
          intentionally narrow.
        </p>
        <div className="mt-6 inline-flex rounded-full border border-black/10 bg-[#fff9ef] px-4 py-2 text-sm text-black/70">
          Signed in as {session.user.email}
        </div>
      </div>

      <AdminConsole />
    </section>
  );
}
