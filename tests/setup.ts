import { config } from "dotenv";
import { afterEach, vi } from "vitest";

// Load environment variables from .env file
config();

// Mock environment variables if they don't exist
process.env.NEWS_API_KEY = process.env.NEWS_API_KEY || "test-news-api-key";
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "mongodb://localhost:27017/techweb-test";
process.env.GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "test-gemini-api-key";

// Mock fetch if needed
if (!global.fetch) {
  global.fetch = vi.fn();
}

// Clean up function to run after each test
afterEach(() => {
  vi.clearAllMocks();
});
