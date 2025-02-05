import ArticleCard from "@/components/articles/ArticleCard";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import type { Article, Category, Translation } from "@prisma/client";

type ArticleWithTranslations = Article & {
  category: Category | null;
  translations: (Translation & {
    language: string;
    title: string;
    content: string;
    summary: string | null;
  })[];
};

interface HomeProps {
  searchParams: { q?: string };
}

async function getArticles(searchQuery?: string) {
  // Get articles with proper search filtering
  const existingArticles = await prisma.article.findMany({
    where: {
      translations: {
        some: {
          language: "he",
          ...(searchQuery && {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { summary: { contains: searchQuery, mode: "insensitive" } },
              { content: { contains: searchQuery, mode: "insensitive" } },
            ],
          }),
        },
      },
      isArchived: false,
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

  // Log the total count of articles
  const totalCount = await prisma.article.count({
    where: {
      translations: {
        some: {
          language: "he",
          ...(searchQuery && {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { summary: { contains: searchQuery, mode: "insensitive" } },
              { content: { contains: searchQuery, mode: "insensitive" } },
            ],
          }),
        },
      },
    },
  });

  const archivedCount = await prisma.article.count({
    where: {
      translations: {
        some: {
          language: "he",
          ...(searchQuery && {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { summary: { contains: searchQuery, mode: "insensitive" } },
              { content: { contains: searchQuery, mode: "insensitive" } },
            ],
          }),
        },
      },
      isArchived: true,
    },
  });

  const nonArchivedCount = await prisma.article.count({
    where: {
      translations: {
        some: {
          language: "he",
          ...(searchQuery && {
            OR: [
              { title: { contains: searchQuery, mode: "insensitive" } },
              { summary: { contains: searchQuery, mode: "insensitive" } },
              { content: { contains: searchQuery, mode: "insensitive" } },
            ],
          }),
        },
      },
      isArchived: false,
    },
  });

  console.log({
    totalArticles: totalCount,
    archivedArticles: archivedCount,
    nonArchivedArticles: nonArchivedCount,
    returnedArticles: existingArticles.length,
  });

  // If we have articles, return them immediately
  if (existingArticles.length > 0) {
    // Only trigger sync if we have fewer than 10 articles and not searching
    if (existingArticles.length < 10 && !searchQuery) {
      const headersList = headers();
      const host = headersList.get("host");
      const protocol =
        process.env.NODE_ENV === "development" ? "http" : "https";
      const baseUrl = `${protocol}://${host}`;

      // Fire and forget - don't await these
      fetch(`${baseUrl}/api/articles/sync`, {
        method: "POST",
        cache: "no-store",
      }).catch(console.error);
    }
    return existingArticles;
  }

  // If no articles exist and not searching, trigger sync
  if (!searchQuery) {
    const headersList = headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    // Trigger sync but don't wait for it
    fetch(`${baseUrl}/api/articles/sync`, {
      method: "POST",
      cache: "no-store",
    }).catch(console.error);
  }

  return [];
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
          {(searchQuery ? articles : otherArticles)
            .filter(
              (article): article is NonNullable<typeof article> =>
                article !== null
            )
            .map((article) => (
              <ArticleCard
                key={article.id}
                article={article as ArticleWithTranslations}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
