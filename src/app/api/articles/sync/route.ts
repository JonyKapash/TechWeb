import { NextResponse } from "next/server";
import { NewsService } from "@/lib/services/newsService";
import { TranslationService } from "@/lib/services/translationService";
import { prisma } from "@/lib/prisma";

export const maxDuration = 60; // Set maximum duration to 60 seconds (Vercel hobby plan limit)

export async function POST() {
  try {
    console.log("Starting article sync process...");
    console.log("GUARDIAN_API_KEY present:", !!process.env.GUARDIAN_API_KEY);
    console.log("GOOGLE_AI_KEY present:", !!process.env.GOOGLE_AI_KEY);

    // 1. Fetch and store new articles
    const result = await NewsService.processAndStoreArticles();
    console.log("Sync completed:", result);

    // 2. Process translations until we have at least 15 articles or hit the time limit
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

    while (translatedCount < 15 && Date.now() - startTime < timeLimit) {
      const batchResult = await TranslationService.processNextBatchOfArticles();
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

      // Add a small delay between batches
      if (translatedCount < 15 && Date.now() - startTime < timeLimit - 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    const timeElapsed = (Date.now() - startTime) / 1000;
    console.log(`Sync process completed in ${timeElapsed} seconds`);

    return NextResponse.json({
      success: true,
      message: `Articles synced and translations processed successfully. Total translations: ${translatedCount}`,
      timeElapsed,
    });
  } catch (error) {
    console.error("Error in sync route:", error);
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
