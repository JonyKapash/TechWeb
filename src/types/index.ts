export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  imageUrl: string;
  sourceUrl: string;
  publishedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  categories: Category[];
  hebrewSummary?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  articles: Article[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchParams {
  query?: string;
  category?: string;
  page?: number;
  pageSize?: number;
}

export interface TranslationResult {
  hebrewTitle: string;
  hebrewSummary: string;
}
