import type { Metadata } from "next";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { 
  ChevronRight, Home as HomeIcon, Layers, 
  BarChart3, Code2, Globe, Database, Shield, 
  Zap, MessageSquare, Paintbrush, Briefcase, 
  Cpu, Search, Video, Music, Share2, 
  Settings, Terminal, LineChart, Mail, Calculator
} from "lucide-react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { listPublicCategories } from "@/server/services/catalog-service";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { Footer } from "@/components/ui/footer";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildCollectionListingSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Browse SaaS Tools by Category | ShipBoost",
  description:
    "Browse SaaS tools by category on ShipBoost, from marketing and analytics to support, sales, and development.",
  url: "/categories",
});

const categoryIconMap: Record<string, LucideIcon> = {
  "marketing": BarChart3,
  "development": Code2,
  "productivity": Zap,
  "analytics": LineChart,
  "design": Paintbrush,
  "security": Shield,
  "database": Database,
  "ai": Cpu,
  "sales": Briefcase,
  "customer-support": MessageSquare,
  "social-media": Share2,
  "video": Video,
  "audio": Music,
  "web-builders": Globe,
  "seo": Search,
  "management": Settings,
  "developer-tools": Terminal,
  "email": Mail,
  "finance": Calculator,
  "hr": Briefcase,
};

function getCategoryIcon(slug: string) {
  return categoryIconMap[slug] || Layers;
}

export default async function CategoriesPage() {
  const categories = await listPublicCategories();
  const env = getEnv();
  const schema = buildCollectionListingSchema({
    name: "Browse Categories",
    description: "Explore curated SaaS categories for bootstrapped founders.",
    url: `${env.NEXT_PUBLIC_APP_URL}/categories`,
    items: categories.map((category) => ({
      name: category.name,
      url: `${env.NEXT_PUBLIC_APP_URL}/categories/${category.slug}`,
    })),
  });

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <ShowcaseLayout>
        <div className="pb-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60  tracking-widest">
            <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <HomeIcon size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground">
              Categories
            </span>
          </nav>
        </div>

        <section className="space-y-10">
          {/* Header */}
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
              Browse Categories
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              Discover the best tools across various industries and use cases.
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.slug);
              return (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="group p-6 bg-card border border-border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:border-foreground/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-all">
                          <Icon size={18} />
                        </div>
                        <h2 className="text-xl font-black group-hover:text-foreground transition-colors">
                          {category.name}
                        </h2>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {category.description || `Browse the best ${category.name.toLowerCase()} tools for founders.`}
                      </p>
                    </div>
                    <ChevronRight size={20} className="text-muted-foreground group-hover:text-foreground transition-all group-hover:translate-x-1 shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          {categories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center text-sm font-medium text-muted-foreground">
              No categories found.
            </div>
          )}
        </section>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}
