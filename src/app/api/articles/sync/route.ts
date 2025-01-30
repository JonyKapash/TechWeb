import { NextResponse } from 'next/server';
import { NewsService } from '@/lib/services/newsService';
import { TranslationService } from '@/lib/services/translationService';

export async function POST() {
  try {
    // 1. Fetch and store new articles
    await NewsService.processAndStoreArticles();
    
    // 2. Process translations for articles that need it
    await TranslationService.processNextBatchOfArticles();

    return NextResponse.json({
      success: true,
      message: 'Articles synced and translations processed successfully',
    });
  } catch (error) {
    console.error('Error in sync route:', error);
    return NextResponse.json(
      { success: false, message: 'Error processing articles' },
      { status: 500 }
    );
  }
} 