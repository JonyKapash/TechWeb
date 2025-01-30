import ArticleCard from "@/components/articles/ArticleCard";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

async function getArticles() {
  const articles = await prisma.article.findMany({
    where: {
      translations: {
        some: {
          language: "he",
          // Ensure we have at least a title and summary
          title: { not: "" },
          summary: { not: "" },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
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

export default async function Home() {
  const articles = await getArticles();

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <h2
          className="text-2xl font-bold text-gray-900 dark:text-white"
          dir="rtl"
        >
          אין מאמרים עדיין
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2" dir="rtl">
          בקרוב יתווספו מאמרים חדשים
        </p>
      </div>
    );
  }

  const [featuredArticle, ...otherArticles] = articles;

  return (
    <div className="space-y-8">
      {/* Featured Article */}
      <section className="mb-12">
        <ArticleCard article={featuredArticle} isFeature />
      </section>

      {/* Latest Articles */}
      {otherArticles.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold text-gray-900 dark:text-white"
              dir="rtl"
            >
              מאמרים אחרונים
            </h2>
            <Link
              href="/archive"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              dir="rtl"
            >
              צפה בהכל
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {otherArticles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
