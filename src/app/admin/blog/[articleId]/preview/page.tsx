import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { BlogArticlePage } from "@/components/blog/blog-article-page";
import { getServerSession } from "@/server/auth/session";
import { getAdminBlogArticleById } from "@/server/services/blog-service";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type RouteContext = {
  params: Promise<{ articleId: string }>;
};

export default async function AdminBlogPreviewPage(context: RouteContext) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { articleId } = await context.params;
  const article = await getAdminBlogArticleById(articleId);

  if (!article) {
    notFound();
  }

  return <BlogArticlePage article={article} relatedArticles={[]} previewMode />;
}
