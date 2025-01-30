import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TranslationService } from "@/lib/services/translationService";

export async function GET() {
  try {
    // Get the first article without a Hebrew translation
    const article = await prisma.article.findFirst({
      where: {
        translations: {
          none: {
            language: "he",
          },
        },
      },
    });

    if (!article) {
      return NextResponse.json({
        success: false,
        message: "No articles found without Hebrew translations",
      });
    }

    // Step 1: Create the summary translation
    const summaryResult = await TranslationService.translateSummary(article);

    // Step 2: Create the full article translation
    const fullResult = await TranslationService.translateFullArticle(
      article.id
    );

    // Get the complete translation to verify
    const translation = await prisma.translation.findFirst({
      where: {
        articleId: article.id,
        language: "he",
      },
    });

    return NextResponse.json({
      success: true,
      article,
      translation,
      summaryResult,
      fullResult,
      message: "Translation test completed successfully",
    });
  } catch (error) {
    console.error("Translation test error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        details: error,
      },
      { status: 500 }
    );
  }
}
