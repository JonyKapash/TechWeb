import { generateStructuredContent } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { Article } from "@prisma/client";

export class TranslationService {
  private static readonly BATCH_SIZE = 5;
  private static readonly MAX_RETRIES = 3;
  private static readonly DELAY_BETWEEN_BATCHES = 200; // 0.2 seconds

  static async translateArticle(article: Article) {
    try {
      // Check for existing translation first
      const existingTranslation = await prisma.translation.findFirst({
        where: {
          articleId: article.id,
          language: "he",
        },
      });

      if (existingTranslation) {
        return { success: true, message: "Translation already exists" };
      }

      // Translate the entire article at once
      const translationPrompt = `
        You are a professional translator specializing in English to Hebrew translation.
        Please translate the following English article to Hebrew with high accuracy and natural flow.
        IMPORTANT: Your response must contain ONLY the translated content in the specified format.
        Do not include any notes, explanations, or metadata about the translation process.
        Do not mention character counts or truncated content.
        Do not add any additional information outside the translation itself.
        
        Title: ${article.title}
        Content: ${article.content}
        
        Format your response exactly as follows:
        TITLE:
        [Hebrew title]
        SUMMARY:
        [A concise summary in Hebrew, max 150 characters]
        CONTENT:
        [Complete Hebrew translation of the content]
      `;

      const translation = await generateStructuredContent<{
        title: string;
        summary: string;
        content: string;
      }>(
        translationPrompt,
        (text) => {
          const titleMatch = text.match(/TITLE:\s*([\s\S]*?)(?=SUMMARY:)/);
          const summaryMatch = text.match(/SUMMARY:\s*([\s\S]*?)(?=CONTENT:)/);
          const contentMatch = text.match(/CONTENT:\s*([\s\S]+)$/);

          if (!titleMatch?.[1] || !summaryMatch?.[1] || !contentMatch?.[1]) {
            throw new Error("Failed to parse translation response");
          }

          const translatedTitle = titleMatch[1].trim();
          const translatedSummary = summaryMatch[1].trim();
          let translatedContent = contentMatch[1].trim();

          if (!translatedTitle || !translatedSummary || !translatedContent) {
            throw new Error("One or more translated fields are empty");
          }

          // Clean up the content
          translatedContent = this.cleanTranslationContent(translatedContent);

          return {
            title: translatedTitle,
            summary: translatedSummary,
            content: translatedContent,
          };
        },
        this.MAX_RETRIES
      );

      // Use a transaction to ensure data consistency
      await prisma.$transaction(async (tx) => {
        // Create or update translation
        await tx.translation.upsert({
          where: {
            articleId_language: {
              articleId: article.id,
              language: "he",
            },
          },
          create: {
            language: "he",
            title: translation.title,
            content: translation.content,
            summary: translation.summary,
            article: {
              connect: {
                id: article.id,
              },
            },
          },
          update: {
            title: translation.title,
            content: translation.content,
            summary: translation.summary,
          },
        });

        // Clear English content
        await tx.article.update({
          where: { id: article.id },
          data: {
            content: "",
            summary: "",
          },
        });
      });

      return { success: true, message: "Article translation completed" };
    } catch (error) {
      console.error("Error translating article:", error);
      throw error;
    }
  }

  private static cleanTranslationContent(content: string): string {
    return content
      .replace(/Note:.*?\[.*?chars\].*$/s, "") // Remove English note
      .replace(/הערה:.*?\[.*?תווים\].*$/s, "") // Remove Hebrew note
      .replace(/\[[\+\-]?\d+\s*(chars|תווים)\]/g, "") // Remove character count indicators
      .split(/\n+/)
      .filter((para) => para.trim())
      .join("\n\n")
      .trim();
  }

  static async processNextBatchOfArticles(batchSizeOverride?: number) {
    try {
      // Get current count of translated articles
      const translatedCount = await prisma.article.count({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
        },
      });

      // Use override if provided, otherwise use default logic
      const batchSize =
        typeof batchSizeOverride === "number"
          ? batchSizeOverride
          : translatedCount <= 10
          ? this.BATCH_SIZE
          : Math.max(2, this.BATCH_SIZE - 2);

      console.log(
        `Processing batch of size ${batchSize}. Current translated count: ${translatedCount}`
      );

      // Get articles that need translation
      const articles = await prisma.article.findMany({
        where: {
          AND: [
            {
              translations: {
                none: {
                  language: "he",
                },
              },
            },
            {
              OR: [{ content: { not: "" } }, { summary: { not: "" } }],
            },
          ],
        },
        take: batchSize,
        orderBy: {
          createdAt: "desc",
        },
      });

      console.log(`Found ${articles.length} articles to translate`);

      let successfulTranslations = 0;
      let failedTranslations = 0;

      // Process each article sequentially for safety
      for (const article of articles) {
        try {
          await this.translateArticle(article);
          successfulTranslations++;

          // Add delay between translations to respect API rate limits
          if (this.DELAY_BETWEEN_BATCHES > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.DELAY_BETWEEN_BATCHES)
            );
          }
        } catch (error) {
          console.error(`Failed to translate article ${article.id}:`, error);
          failedTranslations++;
          continue;
        }
      }

      return {
        success: true,
        articlesProcessed: articles.length,
        successfulTranslations,
        failedTranslations,
        message: `Processed ${articles.length} articles (${successfulTranslations} successful, ${failedTranslations} failed)`,
      };
    } catch (error) {
      console.error("Error processing articles for translation:", error);
      throw error;
    }
  }
}
