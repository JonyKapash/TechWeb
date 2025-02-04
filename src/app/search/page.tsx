import { prisma } from "@/lib/prisma";
import ArticleCard from "@/components/articles/ArticleCard";

interface SearchPageProps {
  searchParams: { q?: string };
}

async function searchArticles(query: string) {
  const articles = await prisma.article.findMany({
    where: {
      translations: {
        some: {
          language: "he",
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
            { content: { contains: query, mode: "insensitive" } },
          ],
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams.q;
  const articles = query ? await searchArticles(query) : [];

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {query ? `תוצאות חיפוש עבור "${query}"` : "אנא הזן מילות חיפוש"}
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {articles.length} תוצאות
        </span>
      </div>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-300">
            לא נמצאו תוצאות עבור &quot;{query}&quot;
          </p>
        </div>
      ) : null}
    </div>
  );
}
