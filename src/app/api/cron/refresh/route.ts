import { NextResponse } from "next/server";
import { NewsService } from "@/lib/services/newsService";
import { TranslationService } from "@/lib/services/translationService";

// Basic security check using a secret key
const isAuthorized = (request: Request) => {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
};

export async function POST(request: Request) {
  try {
    // Verify the request is authorized
    if (!isAuthorized(request)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Step 1: Fetch and store new articles
    const fetchResult = await NewsService.processAndStoreArticles();
    console.log("Articles fetched:", fetchResult);

    // Step 2: Process translations for articles
    let translationResults = [];
    let hasMoreToTranslate = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 5; // Limit the number of translation batches

    // Process translations in batches until no more articles need translation
    while (hasMoreToTranslate && attempts < MAX_ATTEMPTS) {
      const result = await TranslationService.processNextBatchOfArticles();
      translationResults.push(result);

      // Check if we processed any articles in this batch
      if (result.articlesProcessed === 0) {
        hasMoreToTranslate = false;
      }

      attempts++;

      // Add a delay between batches to respect API rate limits
      if (hasMoreToTranslate) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    return NextResponse.json({
      success: true,
      fetchResult,
      translationResults,
      message: "Articles refreshed and translations processed successfully",
    });
  } catch (error) {
    console.error("Error in refresh process:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: "healthy" });
}
