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
      const response = await axios.get<NewsAPIResponse>(
        `https://newsapi.org/v2/everything?domains=${this.NEWS_SOURCES.join(
          ","
        )}&language=en&sortBy=publishedAt&pageSize=10`,
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
