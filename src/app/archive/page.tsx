import ArticleCard from "@/components/articles/ArticleCard";
import { prisma } from "@/lib/prisma";

async function getAllArticles() {
  const articles = await prisma.article.findMany({
    where: {
      translations: {
        some: {
          language: "he",
          title: { not: "" },
          summary: { not: "" },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      translations: {
        where: {
          language: "he",
        },
      },
      category: true,
    },
  });

  return articles;
}

export default async function ArchivePage() {
  const articles = await getAllArticles();

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <h2
          className="text-2xl font-bold text-gray-900 dark:text-white"
          dir="rtl"
        >
          אין מאמרים בארכיון
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2" dir="rtl">
          בקרוב יתווספו מאמרים חדשים
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-3xl font-bold text-gray-900 dark:text-white"
          dir="rtl"
        >
          ארכיון המאמרים
        </h1>
        <p className="text-gray-600 dark:text-gray-300" dir="rtl">
          {articles.length} מאמרים
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
