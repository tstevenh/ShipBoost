import Link from "next/link";

import { HomeLeadMagnetForm } from "@/components/public/home-lead-magnet-form";
import { LaunchBoard } from "@/components/public/launch-board";
import { HomeSearchModal } from "@/components/public/home-search-modal";
import { listPublicCategories } from "@/server/services/catalog-service";
import { getServerSession } from "@/server/auth/session";
import { listLaunchBoard } from "@/server/services/launch-service";
import { getDailyVotesRemaining } from "@/server/services/upvote-service";

type HomePageProps = {
  searchParams?: Promise<{
    q?: string;
  }>;
};

export default async function Home({ searchParams }: HomePageProps) {
  const session = await getServerSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [dailyLaunches, categories, dailyVotesRemaining] = await Promise.all([
    listLaunchBoard("daily", {
      viewerUserId: session?.user.id ?? null,
    }),
    listPublicCategories(),
    session?.user.id
      ? getDailyVotesRemaining(session.user.id)
      : Promise.resolve(null),
  ]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-8">
          <div className="space-y-4">
            <p className="text-sm font-semibold tracking-[0.28em] text-[#9f4f1d] uppercase">
              Bootstrapped SaaS growth infrastructure
            </p>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-black sm:text-6xl">
              Launch your SaaS, earn credible distribution, and build durable
              visibility.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-black/68">
              Shipboost is building a focused launch-and-distribution engine for
              bootstrapped SaaS founders. Start with a listing, move into free
              launches with a featured badge, then layer on done-for-you
              distribution when you need more reach.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={session ? "/dashboard" : "/sign-up"}
              className="inline-flex items-center justify-center rounded-full bg-[#143f35] px-7 py-3.5 text-base font-semibold text-white transition hover:bg-[#0d2e26]"
            >
              {session ? "Open dashboard" : "Create founder account"}
            </Link>
            <Link
              href={session ? "/submit" : "/sign-in"}
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-7 py-3.5 text-base font-semibold text-black transition hover:border-black/20 hover:bg-black/[0.03]"
            >
              {session ? "Submit your product" : "Sign in"}
            </Link>
          </div>

          <HomeSearchModal initialQuery={resolvedSearchParams?.q} />

          <HomeLeadMagnetForm />

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.75rem] border border-black/10 bg-white/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
              <p className="text-sm font-semibold text-[#9f4f1d]">
                Affiliate listings
              </p>
              <p className="mt-2 text-sm leading-6 text-black/65">
                Clean tool profiles that can compound discovery and monetize via
                trusted affiliate placements.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-black/10 bg-white/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
              <p className="text-sm font-semibold text-[#9f4f1d]">
                Free launches with badge
              </p>
              <p className="mt-2 text-sm leading-6 text-black/65">
                Founders can launch for free while feeding the site’s authority
                loop through the featured badge requirement.
              </p>
            </div>
            <div className="rounded-[1.75rem] border border-black/10 bg-white/90 p-5 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
              <p className="text-sm font-semibold text-[#9f4f1d]">
                Done-for-you distribution
              </p>
              <p className="mt-2 text-sm leading-6 text-black/65">
                The early revenue wedge: hands-on distribution support for
                founders who need leverage faster than SEO compounds.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-[#1d1c1a] p-8 text-[#f6e8d4] shadow-[0_28px_90px_rgba(29,28,26,0.28)] sm:p-10">
          <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
            Current auth status
          </p>
          <div className="mt-8 space-y-5">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-[#f6e8d4]/70">Session</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {session ? "Authenticated" : "Guest"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-[#f6e8d4]/70">Role</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {session ? session.user.role : "No account yet"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-[#f6e8d4]/70">Next action</p>
              <p className="mt-2 text-base leading-7 text-[#f6e8d4]/85">
                {session
                  ? "Use the dashboard to test the founder session flow, then promote your account to admin if you want moderation access."
                  : "Create an account, sign in, and then run the admin promotion script against that email when you are ready to test moderation."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-8">
        <LaunchBoard
          board="daily"
          launches={dailyLaunches}
          dailyVotesRemaining={dailyVotesRemaining}
        />

        <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
          <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
            Browse by category
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="rounded-full border border-black/10 bg-[#fff9ef] px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-[#fff3de]"
              >
                {category.name}
              </Link>
            ))}
            {categories.length === 0 ? (
              <p className="text-sm text-black/55">
                Categories will appear here once published tools are live.
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
