import axios from "axios";
import { prisma } from "@/lib/prisma";
import { Article } from "@prisma/client";

interface GuardianResponse {
  response: {
    status: string;
    total: number;
    results: {
      id: string;
      type: string;
      sectionId: string;
      sectionName: string;
      webPublicationDate: string;
      webTitle: string;
      webUrl: string;
      apiUrl: string;
      fields: {
        headline: string;
        standfirst: string;
        body: string;
        wordcount: string;
        thumbnail: string;
        bodyText: string;
      };
    }[];
  };
}

export class NewsService {
  private static readonly GUARDIAN_API_BASE =
    "https://content.guardianapis.com";

  static async fetchLatestTechNews() {
    try {
      // First, check how many articles we currently have with Hebrew translations
      const currentArticleCount = await prisma.article.count({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
        },
      });

      // Calculate how many articles we need to fetch
      const fetchCount = Math.max(15, currentArticleCount <= 10 ? 25 : 15);

      const response = await axios.get<GuardianResponse>(
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

      if (
        !response.data.response.results ||
        response.data.response.results.length === 0
      ) {
        console.warn("No articles found in the response");
        return [];
      }

      return response.data.response.results.map((article) => {
        // Extract a clean version of the body text
        const cleanContent = article.fields.bodyText.replace(/\n/g, " ").trim();

        // Generate summary from standfirst or first few sentences
        const summary = article.fields.standfirst
          ? this.cleanHtml(article.fields.standfirst)
          : this.generateSummary(cleanContent);

        return {
          title: article.fields.headline || article.webTitle,
          content: cleanContent,
          description: summary,
          url: article.webUrl,
          urlToImage: article.fields.thumbnail,
          publishedAt: article.webPublicationDate,
          source: {
            name: "The Guardian",
          },
        };
      });
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  }

  private static cleanHtml(text: string): string {
    return text.replace(/<[^>]*>/g, "").trim();
  }

  private static generateSummary(content: string) {
    // Split into sentences and remove empty ones
    const sentences =
      content
        .match(/[^.!?]+[.!?]+/g)
        ?.filter((sentence) => sentence.trim().length > 0) || [];

    // Take first 2-3 sentences based on length
    let summary = "";
    let sentenceCount = 0;

    for (const sentence of sentences) {
      if (summary.length + sentence.length > 200 || sentenceCount >= 3) break;
      summary += (summary ? " " : "") + sentence.trim();
      sentenceCount++;
    }

    return summary;
  }

  static async processAndStoreArticles() {
    try {
      const articles = await this.fetchLatestTechNews();

      // Calculate the timestamp for 24 hours ago
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Archive articles older than 24 hours
      await prisma.article.updateMany({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
          isArchived: false,
          createdAt: {
            lt: twentyFourHoursAgo,
          },
        },
        data: {
          isArchived: true,
        },
      });

      // Store new articles
      for (const article of articles) {
        // Create URL-friendly slug from title
        const slug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Check if article already exists
        const existingArticle = await prisma.article.findUnique({
          where: { slug },
        });

        if (!existingArticle) {
          // Store new article
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

      // After storing new articles, ensure we have at least 10 non-archived articles
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

      // If we have fewer than 10 non-archived articles, unarchive the most recent archived ones
      if (nonArchivedCount < 10) {
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
          take: 10 - nonArchivedCount,
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

      return { success: true, message: "Articles processed successfully" };
    } catch (error) {
      console.error("Error processing articles:", error);
      throw error;
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
