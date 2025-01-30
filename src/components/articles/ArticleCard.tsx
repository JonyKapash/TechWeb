import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import type { Article, Category } from "@prisma/client";

interface ArticleWithTranslations extends Article {
  translations: {
    language: string;
    title: string;
    content: string | null;
    summary: string | null;
  }[];
  category: Category | null;
}

interface ArticleCardProps {
  article: ArticleWithTranslations;
  isFeature?: boolean;
}

export default function ArticleCard({
  article,
  isFeature = false,
}: ArticleCardProps) {
  // Get Hebrew translation
  const hebrewTranslation = article.translations.find(
    (t) => t.language === "he"
  );

  // If no Hebrew translation is available yet, show a loading state
  if (!hebrewTranslation) {
    return (
      <article className="relative animate-pulse">
        <div
          className={`relative ${
            isFeature ? "aspect-[21/9]" : "aspect-[16/9]"
          } w-full overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800`}
        />
        <div className="mt-4 space-y-2">
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
      </article>
    );
  }

  const defaultImage = "/images/placeholder.svg";

  if (isFeature) {
    return (
      <article className="relative group" dir="rtl">
        <div className="relative aspect-[21/9] w-full overflow-hidden rounded-xl bg-gray-200 dark:bg-gray-800">
          <Image
            src={article.imageUrl || defaultImage}
            alt={hebrewTranslation.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent" />
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <div className="space-y-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <div className="flex items-center gap-2">
                {article.category && (
                  <Link
                    href={`/category/${article.category.slug}`}
                    className="text-xs font-semibold uppercase tracking-wider text-violet-300 hover:text-violet-200 transition-colors"
                  >
                    {article.category.name}
                  </Link>
                )}
                <span className="text-xs text-gray-300">
                  {formatDistanceToNow(new Date(article.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <Link
                href={`/article/${article.slug}`}
                className="group/link block"
              >
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-white group-hover/link:text-violet-200 transition-all duration-300">
                  {hebrewTranslation.title}
                </h2>
                {hebrewTranslation.summary && (
                  <p className="mt-4 text-lg text-gray-200 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                    {hebrewTranslation.summary}
                  </p>
                )}
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group" dir="rtl">
      <div className="relative aspect-[16/9] overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-800">
        <Image
          src={article.imageUrl || defaultImage}
          alt={hebrewTranslation.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-transparent group-hover:opacity-90 transition-opacity duration-300" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          {article.category && (
            <Link
              href={`/category/${article.category.slug}`}
              className="text-xs font-semibold uppercase tracking-wider text-violet-600/80 dark:text-violet-400/80 hover:text-violet-600 dark:hover:text-violet-300 transition-colors"
            >
              {article.category.name}
            </Link>
          )}
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {formatDistanceToNow(new Date(article.createdAt), {
              addSuffix: true,
            })}
          </span>
        </div>
        <Link href={`/article/${article.slug}`} className="group/link block">
          <h3 className="text-xl font-bold leading-tight text-gray-900 dark:text-white group-hover/link:text-violet-600 dark:group-hover/link:text-violet-400 transition-all duration-300">
            {hebrewTranslation.title}
          </h3>
          {hebrewTranslation.summary && (
            <p className="mt-2 text-gray-600 dark:text-gray-300 line-clamp-2 opacity-60 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
              {hebrewTranslation.summary}
            </p>
          )}
        </Link>
      </div>
    </article>
  );
}
