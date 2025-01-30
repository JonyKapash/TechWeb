import axios from "axios";
import { z } from "zod";

const newsApiKey = process.env.NEWS_API_KEY;
const baseUrl = "https://newsapi.org/v2";

const ArticleSchema = z.object({
  source: z.object({
    id: z.string().nullable(),
    name: z.string(),
  }),
  author: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  url: z.string(),
  urlToImage: z.string().nullable(),
  publishedAt: z.string(),
  content: z.string().nullable(),
});

const NewsResponseSchema = z.object({
  status: z.string(),
  totalResults: z.number(),
  articles: z.array(ArticleSchema),
});

export type NewsArticle = z.infer<typeof ArticleSchema>;

interface FetchArticlesOptions {
  category?: string;
  query?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchArticles({
  category,
  query,
  page = 1,
  pageSize = 12,
}: FetchArticlesOptions = {}) {
  try {
    const params = new URLSearchParams({
      apiKey: newsApiKey!,
      language: "en",
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(category && { category }),
      ...(query && { q: query }),
    });

    const response = await axios.get(`${baseUrl}/top-headlines?${params}`);
    const parsed = NewsResponseSchema.parse(response.data);

    return {
      articles: parsed.articles,
      totalResults: parsed.totalResults,
    };
  } catch (error) {
    console.error("Error fetching news articles:", error);
    throw new Error("Failed to fetch news articles");
  }
}

export async function searchArticles(query: string, page = 1, pageSize = 12) {
  try {
    const params = new URLSearchParams({
      apiKey: newsApiKey!,
      q: query,
      language: "en",
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    const response = await axios.get(`${baseUrl}/everything?${params}`);
    const parsed = NewsResponseSchema.parse(response.data);

    return {
      articles: parsed.articles,
      totalResults: parsed.totalResults,
    };
  } catch (error) {
    console.error("Error searching articles:", error);
    throw new Error("Failed to search articles");
  }
}
