import Link from "next/link";
import { SubmitProductForm } from "@/components/founder/submit-product-form";
import { getServerSession } from "@/server/auth/session";
import { getCachedCatalogOptions } from "@/server/cache/catalog-options";
import { getEnv } from "@/server/env";
import { Footer } from "@/components/ui/footer";
import { Rocket, ArrowRight } from "lucide-react";

const testimonials = [
  {
    quote: "ShipBoost generates a steady stream of high-quality traffic every month. Much better than generic AI lists.",
    author: "Nico Jeannen",
    handle: "@nico_jeannen"
  },
  {
    quote: "One of the few launchpads I check every day. The community actually cares about bootstrapped products.",
    author: "John Rush",
    handle: "@johnrushx"
  },
  {
    quote: "I launched my project lately and it gave me far more attention than Product Hunt. Truly founder-native.",
    author: "Sebastian Krauskopf",
    handle: "@sekraus"
  }
];

export default async function SubmitPage() {
  const session = await getServerSession();
  const env = getEnv();

  if (!session) {
    return (
      <main className="flex-1 flex flex-col bg-background pt-32">
        <section className="mx-auto max-w-4xl px-6">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl font-black tracking-tight text-foreground lowercase">
              Submit your Product
            </h1>
            <p className="text-xl font-medium text-muted-foreground">
              Join a curated ecosystem of serious founders building credible distribution loops.
            </p>
          </div>

          <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-xl shadow-black/5 text-center space-y-8 mb-32">
            <p className="text-lg font-medium text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              You must have an account to submit a product to ShipBoost. 
              This allows you to manage your listing and track your launch momentum later.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up?redirect=/submit"
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:opacity-90 active:scale-95 transition-all"
              >
                Create an account
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/sign-in?redirect=/submit"
                className="flex items-center gap-2 bg-muted text-foreground px-8 py-4 rounded-2xl font-black text-sm hover:opacity-70 transition-all"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
        <Footer className="mt-auto" />
      </main>
    );
  }

  const { categories, tags } = await getCachedCatalogOptions();

  return (
    <main className="flex-1 flex flex-col bg-muted/20 pt-32">
      <section className="mx-auto max-w-7xl px-6 mb-32">
        <SubmitProductForm
          categories={categories}
          tags={tags}
          appUrl={env.NEXT_PUBLIC_APP_URL}
          founderEmail={session.user.email}
          supportEmail={env.RESEND_REPLY_TO_TRANSACTIONAL ?? session.user.email}
        />
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
