import { NextResponse } from "next/server";
import { NewsService } from "@/lib/services/newsService";

export async function GET() {
  try {
    // Fetch and store new articles
    const result = await NewsService.processAndStoreArticles();

    return NextResponse.json({
      success: true,
      result,
      message: "Articles fetched and stored successfully",
    });
  } catch (error) {
    console.error("Article fetch test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
