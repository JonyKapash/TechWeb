import { NextResponse } from "next/server";
import { TranslationService } from "@/lib/services/translationService";

export async function POST() {
  try {
    const result = await TranslationService.processNextBatchOfArticles();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing translations:", error);
    return NextResponse.json(
      { error: "Failed to process translations" },
      { status: 500 }
    );
  }
} 