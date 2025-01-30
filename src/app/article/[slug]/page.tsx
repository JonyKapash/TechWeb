import { prisma } from "@/lib/prisma";
import { TranslationService } from "@/lib/services/translationService";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { notFound } from "next/navigation";
import Link from "next/link";

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

async function getArticleWithTranslation(slug: string) {
  const article = await prisma.article.findUnique({
    where: { slug },
    include: {
      translations: {
        where: { language: "he" },
      },
      category: true,
    },
  });

  if (
    !article ||
    !article.translations.length ||
    !article.translations[0].content
  ) {
    return null;
  }

  return article;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticleWithTranslation(params.slug);

  if (!article) {
    notFound();
  }

  const hebrewTranslation = article.translations[0];

  if (!hebrewTranslation) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center" dir="rtl">
        <div className="animate-pulse space-y-8">
          <div className="aspect-[21/9] w-full bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 mx-auto bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-1/2 mx-auto bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
          <div className="space-y-4">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const defaultImage = "/images/placeholder.svg";

  return (
    <article className="max-w-4xl mx-auto" dir="rtl">
      {/* Article Header */}
      <header className="mb-8">
        {article.imageUrl && (
          <div className="relative aspect-[21/9] mb-6 rounded-xl overflow-hidden">
            <Image
              src={article.imageUrl || defaultImage}
              alt={hebrewTranslation.title}
              fill
              className="object-cover"
              priority
            />
          </div>
        )}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>
              {formatDistanceToNow(new Date(article.createdAt), {
                addSuffix: true,
              })}
            </span>
            {article.category && (
              <>
                <span>•</span>
                <Link
                  href={`/category/${article.category.slug}`}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  {article.category.name}
                </Link>
              </>
            )}
          </div>

          {/* Hebrew Title & Summary */}
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-violet-600 dark:text-violet-400 transition-colors duration-300">
              {hebrewTranslation.title}
            </h1>
            {hebrewTranslation.summary && (
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {hebrewTranslation.summary}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Article Content */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {/* Hebrew Content */}
        <div className="whitespace-pre-wrap break-words leading-relaxed">
          {hebrewTranslation.content?.split("\n").map(
            (paragraph, index) =>
              paragraph.trim() && (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              )
          )}
        </div>
      </div>

      {/* Source Link */}
      {article.sourceUrl && (
        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
          >
            קרא את המאמר המקורי
          </a>
        </div>
      )}
    </article>
  );
}
