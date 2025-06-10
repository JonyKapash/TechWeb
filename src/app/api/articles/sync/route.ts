import { prisma } from "@/lib/prisma";
import { NewsService } from "@/lib/services/newsService";
import { TranslationService } from "@/lib/services/translationService";
import { NextResponse } from "next/server";

export const maxDuration = 60; // Maximum execution time in seconds

export async function POST() {
  try {
    console.log("Starting article sync process...");

    // Validate environment variables
    if (!process.env.GUARDIAN_API_KEY) {
      throw new Error("GUARDIAN_API_KEY is not configured");
    }
    if (!process.env.GOOGLE_AI_KEY) {
      throw new Error("GOOGLE_AI_KEY is not configured");
    }

    // Step 1: Fetch and store new articles
    console.log("Fetching and storing new articles...");
    const fetchResult = await NewsService.processAndStoreArticles();
    console.log("Articles fetched:", fetchResult);

    // Step 2: Process translations
    console.log("Processing translations...");
    let translatedCount = await prisma.article.count({
      where: {
        translations: {
          some: {
            language: "he",
          },
        },
      },
    });

    console.log("Current translated count:", translatedCount);
    const startTime = Date.now();
    const timeLimit = 50 * 1000; // 50 seconds to allow for overhead
    const translationResults = [];
    let hasMoreToTranslate = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    while (
      hasMoreToTranslate &&
      attempts < MAX_ATTEMPTS &&
      Date.now() - startTime < timeLimit
    ) {
      const batchResult = await TranslationService.processNextBatchOfArticles();
      translationResults.push(batchResult);
      console.log("Batch translation result:", batchResult);

      // Update count
      translatedCount = await prisma.article.count({
        where: {
          translations: {
            some: {
              language: "he",
            },
          },
        },
      });

      console.log("Updated translated count:", translatedCount);

      // Check if we need to continue
      if (batchResult.articlesProcessed === 0) {
        hasMoreToTranslate = false;
      }

      attempts++;

      // Add delay between batches if we're continuing
      if (hasMoreToTranslate && Date.now() - startTime < timeLimit - 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const timeElapsed = (Date.now() - startTime) / 1000;
    console.log(`Sync process completed in ${timeElapsed} seconds`);

    return NextResponse.json({
      success: true,
      message: `Articles synced and translations processed successfully. Total translations: ${translatedCount}`,
      timeElapsed,
      fetchResult,
      translationResults,
    });
  } catch (error) {
    console.error("Error in sync process:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error processing articles",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
