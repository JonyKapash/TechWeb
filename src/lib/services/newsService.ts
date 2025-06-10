import { prisma } from "@/lib/prisma";
import axios from "axios";
import { z } from "zod";

// Validation schemas
const GuardianArticleSchema = z.object({
  webTitle: z.string(),
  webUrl: z.string(),
  webPublicationDate: z.string(),
  fields: z.object({
    headline: z.string().optional(),
    bodyText: z.string(),
    standfirst: z.string().optional(),
    thumbnail: z.string().optional(),
  }),
});

const GuardianResponseSchema = z.object({
  response: z.object({
    results: z.array(GuardianArticleSchema),
    total: z.number(),
  }),
});

export class NewsService {
  private static readonly GUARDIAN_API_BASE =
    "https://content.guardianapis.com";
  private static readonly MIN_ARTICLES = 10;
  private static readonly MAX_ARTICLES = 25;
  private static readonly ARCHIVE_AGE_HOURS = 24;

  static async fetchLatestTechNews() {
    try {
      // Check current article count
      const currentArticleCount = await prisma.article.count({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
        },
      });

      // Calculate fetch count based on current articles
      const fetchCount = Math.max(
        this.MIN_ARTICLES,
        currentArticleCount <= this.MIN_ARTICLES
          ? this.MAX_ARTICLES
          : this.MIN_ARTICLES
      );

      const response = await axios.get<z.infer<typeof GuardianResponseSchema>>(
        `${this.GUARDIAN_API_BASE}/search`,
        {
          params: {
            "api-key": process.env.GUARDIAN_API_KEY,
            section: "technology",
            "show-fields": "all",
            "page-size": fetchCount,
            "order-by": "newest",
          },
        }
      );

      // Validate response
      const validatedData = GuardianResponseSchema.parse(response.data);

      if (!validatedData.response.results?.length) {
        console.warn("No articles found in the response");
        return [];
      }

      return validatedData.response.results.map((article) => ({
        title: article.fields.headline || article.webTitle,
        content: this.cleanContent(article.fields.bodyText),
        description: this.generateSummary(
          article.fields.standfirst,
          article.fields.bodyText
        ),
        url: article.webUrl,
        urlToImage: article.fields.thumbnail,
        publishedAt: article.webPublicationDate,
        source: {
          name: "The Guardian",
        },
      }));
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  }

  private static cleanContent(content: string): string {
    return content.replace(/\n/g, " ").replace(/\s+/g, " ").trim();
  }

  private static generateSummary(
    standfirst?: string,
    content?: string
  ): string {
    if (standfirst) {
      return this.cleanContent(standfirst);
    }
    if (content) {
      // Take first 150 characters of content
      return this.cleanContent(content).slice(0, 150) + "...";
    }
    return "";
  }

  static async processAndStoreArticles() {
    try {
      const articles = await this.fetchLatestTechNews();

      // Calculate archive threshold
      const archiveThreshold = new Date(
        Date.now() - this.ARCHIVE_AGE_HOURS * 60 * 60 * 1000
      );

      // Archive old articles
      await prisma.article.updateMany({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
          isArchived: false,
          createdAt: {
            lt: archiveThreshold,
          },
        },
        data: {
          isArchived: true,
        },
      });

      // Store new articles
      for (const article of articles) {
        const slug = this.generateSlug(article.title);

        // Check for existing article
        const existingArticle = await prisma.article.findUnique({
          where: { slug },
        });

        if (!existingArticle) {
          await prisma.article.create({
            data: {
              title: article.title,
              slug,
              content: article.content,
              summary: article.description,
              imageUrl: article.urlToImage,
              sourceUrl: article.url,
              sourceProvider: article.source.name,
              published: true,
              isArchived: false,
              createdAt: new Date(article.publishedAt),
              updatedAt: new Date(article.publishedAt),
            },
          });
        }
      }

      // Ensure minimum article count
      await this.ensureMinimumArticleCount();

      return { success: true, message: "Articles processed successfully" };
    } catch (error) {
      console.error("Error processing articles:", error);
      throw error;
    }
  }

  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private static async ensureMinimumArticleCount() {
    const nonArchivedCount = await prisma.article.count({
      where: {
        translations: {
          some: {
            language: "he",
          },
        },
        isArchived: false,
      },
    });

    if (nonArchivedCount < this.MIN_ARTICLES) {
      const articlesToUnarchive = await prisma.article.findMany({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
          isArchived: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: this.MIN_ARTICLES - nonArchivedCount,
      });

      if (articlesToUnarchive.length > 0) {
        await prisma.article.updateMany({
          where: {
            id: {
              in: articlesToUnarchive.map((article) => article.id),
            },
          },
          data: {
            isArchived: false,
          },
        });
      }
    }
  }

  static async getArticlesForTranslation() {
    try {
      // Get articles that don't have Hebrew translations yet
      const articles = await prisma.article.findMany({
        where: {
          translations: {
            none: {
              language: "he",
            },
          },
        },
        take: 5, // Process 5 articles at a time
        orderBy: {
          createdAt: "desc",
        },
      });

      return articles;
    } catch (error) {
      console.error("Error getting articles for translation:", error);
      throw error;
    }
  }
}
