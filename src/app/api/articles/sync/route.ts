import { prisma } from "@/lib/prisma";
import { NewsService } from "@/lib/services/newsService";
import { TranslationService } from "@/lib/services/translationService";
import { NextResponse } from "next/server";

export const maxDuration = 30; // Lower for serverless safety

export async function POST() {
  try {
    // Validate environment variables
    if (!process.env.GUARDIAN_API_KEY) {
      throw new Error("GUARDIAN_API_KEY is not configured");
    }
    if (!process.env.GOOGLE_AI_KEY) {
      throw new Error("GOOGLE_AI_KEY is not configured");
    }

    // Step 1: Fetch and store new articles (should be fast)
    const fetchResult = await NewsService.processAndStoreArticles();

    // Step 2: Process a small translation batch (e.g., 2 articles)
    const translationResult =
      await TranslationService.processNextBatchOfArticles(2);

    // Get updated translated count
    const translatedCount = await prisma.article.count({
      where: {
        translations: {
          some: { language: "he" },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Articles synced and a small translation batch processed. Total translations: ${translatedCount}`,
      fetchResult,
      translationResult,
      translatedCount,
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
