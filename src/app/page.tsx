import ArticleCard from "@/components/articles/ArticleCard";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

interface HomeProps {
  searchParams: { q?: string };
}

async function getArticles(searchQuery?: string) {
  const baseQuery = {
    translations: {
      some: {
        language: "he",
        title: { not: "" },
        summary: { not: "" },
      },
    },
  };

  if (searchQuery) {
    baseQuery.translations.some.OR = [
      { title: { contains: searchQuery, mode: "insensitive" } },
      { summary: { contains: searchQuery, mode: "insensitive" } },
      { content: { contains: searchQuery, mode: "insensitive" } },
    ];
  }

  const articles = await prisma.article.findMany({
    where: baseQuery,
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

export default async function Home({ searchParams }: HomeProps) {
  const searchQuery = searchParams.q;
  const articles = await getArticles(searchQuery);

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12">
        <h2
          className="text-2xl font-bold text-gray-900 dark:text-white"
          dir="rtl"
        >
          {searchQuery
            ? `לא נמצאו תוצאות עבור "${searchQuery}"`
            : "אין מאמרים עדיין"}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-2" dir="rtl">
          {searchQuery ? "נסה לחפש משהו אחר" : "בקרוב יתווספו מאמרים חדשים"}
        </p>
      </div>
    );
  }

  // Only split into featured and other articles when not searching
  const [featuredArticle, ...otherArticles] = !searchQuery
    ? articles
    : [null, ...articles];

  return (
    <div className="space-y-8">
      {/* Featured Article - Only show when not searching */}
      {!searchQuery && featuredArticle && (
        <section className="mb-12">
          <ArticleCard article={featuredArticle} isFeature />
        </section>
      )}

      {/* Articles Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-2xl font-bold text-gray-900 dark:text-white"
            dir="rtl"
          >
            {searchQuery
              ? `תוצאות חיפוש עבור "${searchQuery}"`
              : "מאמרים אחרונים"}
          </h2>
          {!searchQuery && (
            <Link
              href="/archive"
              className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              dir="rtl"
            >
              צפה בהכל
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(searchQuery ? articles : otherArticles).map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
