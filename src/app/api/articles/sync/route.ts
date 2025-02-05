import { NextResponse } from "next/server";
import { NewsService } from "@/lib/services/newsService";
import { TranslationService } from "@/lib/services/translationService";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    console.log("Starting article sync process...");
    console.log("GUARDIAN_API_KEY present:", !!process.env.GUARDIAN_API_KEY);

    // 1. Fetch and store new articles
    const result = await NewsService.processAndStoreArticles();
    console.log("Sync completed:", result);

    // 2. Process translations until we have at least 15 articles
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

    while (translatedCount < 15) {
      await TranslationService.processNextBatchOfArticles();

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
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return NextResponse.json({
      success: true,
      message: `Articles synced and translations processed successfully. Total translations: ${translatedCount}`,
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
