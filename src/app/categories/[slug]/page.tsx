import { notFound } from "next/navigation";

import { PublicToolCard } from "@/components/public/public-tool-card";
import { getPublicCategoryBySlug } from "@/server/services/catalog-service";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage(context: RouteContext) {
  const { slug } = await context.params;
  const category = await getPublicCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
          Category
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
          {category.name}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/66">
          {category.seoIntro ?? category.description ?? "Published tools in this category."}
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {category.toolCategories.map((item) => (
          <PublicToolCard key={item.tool.slug} tool={item.tool} />
        ))}

        {category.toolCategories.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
            No published tools in this category yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
