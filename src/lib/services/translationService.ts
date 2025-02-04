import { prisma } from "@/lib/prisma";
import { Article } from "@prisma/client";
import { generateStructuredContent } from "@/lib/gemini";

export class TranslationService {
  static async translateArticle(article: Article) {
    try {
      // Translate the entire article at once (title, summary, and content)
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
            console.error("Failed to parse translation. Received text:", text);
            throw new Error("Failed to parse translation");
          }

          const translatedTitle = titleMatch[1].trim();
          const translatedSummary = summaryMatch[1].trim();
          let translatedContent = contentMatch[1].trim();

          if (!translatedTitle || !translatedSummary || !translatedContent) {
            throw new Error("One or more translated fields are empty");
          }

          // Remove any metadata or note messages
          translatedContent = translatedContent
            .replace(/Note:.*?\[.*?chars\].*$/s, "") // Remove English note
            .replace(/הערה:.*?\[.*?תווים\].*$/s, "") // Remove Hebrew note
            .replace(/\[[\+\-]?\d+\s*(chars|תווים)\]/g, "") // Remove character count indicators
            .trim();

          // Ensure proper paragraph formatting
          const formattedContent = translatedContent
            .split(/\n+/)
            .filter((para) => para.trim())
            .join("\n\n");

          // Validate no metadata messages remain
          if (
            formattedContent.includes("[+") ||
            formattedContent.includes("Note:") ||
            formattedContent.includes("הערה:") ||
            formattedContent.includes("chars]") ||
            formattedContent.includes("תווים]")
          ) {
            throw new Error("Translation contains metadata messages");
          }

          return {
            title: translatedTitle,
            summary: translatedSummary,
            content: formattedContent,
          };
        },
        5
      ); // Increased max retries to 5 for metadata issues

      // Store the complete translation and clear English content in a single transaction
      await prisma.$transaction([
        // Create Hebrew translation with all content
        prisma.translation.create({
          data: {
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
        }),
        // Clear English content
        prisma.article.update({
          where: { id: article.id },
          data: {
            content: "", // Clear English content
            summary: "", // Clear English summary
          },
        }),
      ]);

      return { success: true, message: "Article translation completed" };
    } catch (error) {
      console.error("Error translating article:", error);
      throw error;
    }
  }

  static async processNextBatchOfArticles() {
    try {
      // Check current count of articles with Hebrew translations
      const translatedCount = await prisma.article.count({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
        },
      });

      // Determine batch size based on current translated count
      const batchSize = translatedCount <= 10 ? 5 : 3;

      // Get articles that need translation
      const articles = await prisma.article.findMany({
        where: {
          translations: {
            none: {
              language: "he",
            },
          },
          // Only get articles that still have English content
          content: {
            not: "",
          },
        },
        take: batchSize,
        orderBy: {
          createdAt: "desc",
        },
      });

      // Translate each article completely (summary + full content)
      for (const article of articles) {
        await this.translateArticle(article);
        // Add delay between translations for free tier
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return {
        success: true,
        articlesProcessed: articles.length,
        message: `Processed ${articles.length} articles for translation`,
      };
    } catch (error) {
      console.error("Error processing articles for translation:", error);
      throw error;
    }
  }
}
