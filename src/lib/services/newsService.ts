import axios from "axios";
import { prisma } from "@/lib/prisma";
import { Article } from "@prisma/client";

interface NewsAPIResponse {
  articles: {
    title: string;
    description: string;
    content: string;
    url: string;
    urlToImage: string;
    publishedAt: string;
    source: {
      name: string;
    };
  }[];
}

export class NewsService {
  private static readonly NEWS_SOURCES = [
    "techcrunch.com",
    "theverge.com",
    "wired.com",
    "arstechnica.com",
  ];

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

      // Calculate how many articles we need to fetch (minimum 15 to ensure we get enough after filtering)
      const fetchCount = Math.max(15, currentArticleCount <= 10 ? 25 : 15);

      const response = await axios.get<NewsAPIResponse>(
        `https://newsapi.org/v2/everything?domains=${this.NEWS_SOURCES.join(
          ","
        )}&language=en&sortBy=publishedAt&pageSize=${fetchCount}`,
        {
          headers: {
            "X-Api-Key": process.env.NEWS_API_KEY || "",
          },
        }
      );

      return response.data.articles;
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  }

  static async processAndStoreArticles() {
    try {
      const articles = await this.fetchLatestTechNews();

      // Get current main page articles (10 most recent)
      const currentMainArticles = await prisma.article.findMany({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      });

      // Archive old main page articles by updating their status
      if (currentMainArticles.length > 0) {
        await prisma.article.updateMany({
          where: {
            id: {
              in: currentMainArticles.map((article) => article.id),
            },
          },
          data: {
            isArchived: true,
          },
        });
      }

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
              content: article.content || article.description,
              summary: article.description,
              imageUrl: article.urlToImage,
              sourceUrl: article.url,
              sourceProvider: article.source.name,
              published: true,
              isArchived: false, // New articles start as non-archived
              createdAt: new Date(article.publishedAt),
              updatedAt: new Date(article.publishedAt),
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
