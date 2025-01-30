import { NextResponse } from "next/server";
import { NewsService } from "@/lib/services/newsService";
import { TranslationService } from "@/lib/services/translationService";

// Basic security check - you should replace this with a more secure solution
const isAuthorized = (request: Request) => {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
};

export async function POST(request: Request) {
  try {
    // Check authorization
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // 1. Fetch and store new articles
    const articlesResult = await NewsService.processAndStoreArticles();

    // 2. Process translations for a batch of articles
    const translationsResult =
      await TranslationService.processNextBatchOfArticles();

    return NextResponse.json({
      success: true,
      articles: articlesResult,
      translations: translationsResult,
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Optional: Add a health check endpoint
export async function GET() {
  return NextResponse.json({ status: "healthy" });
}
