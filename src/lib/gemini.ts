import axios from "axios";

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 60, // Maximum requests per minute for free tier
  interval: 60 * 1000, // 1 minute in milliseconds
};

class RateLimiter {
  private requests: number = 0;
  private lastReset: number = Date.now();

  async checkLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastReset >= RATE_LIMIT.interval) {
      this.requests = 0;
      this.lastReset = now;
    }

    if (this.requests >= RATE_LIMIT.maxRequests) {
      const waitTime = RATE_LIMIT.interval - (now - this.lastReset);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.checkLimit();
    }

    this.requests++;
  }
}

const rateLimiter = new RateLimiter();

// Helper function for text generation
export async function generateText(prompt: string): Promise<string> {
  try {
    // Verify API key is set
    const apiKey = process.env.GOOGLE_AI_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_KEY is not set in environment variables");
    }

    // Check rate limit before making request
    await rateLimiter.checkLimit();

    // Make API call
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the generated text from the response
    const generatedText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      throw new Error("No text generated from the API");
    }

    return generatedText;
  } catch (error: any) {
    console.error("Gemini API error:", {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
    });

    if (error?.response?.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    throw new Error(
      error?.response?.data?.error?.message ||
        error?.message ||
        "Failed to generate text"
    );
  }
}

// Helper function for structured generation with retries
export async function generateStructuredContent<T>(
  prompt: string,
  parser: (text: string) => T,
  maxRetries = 3
): Promise<T> {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const text = await generateText(prompt);
      return parser(text);
    } catch (error: any) {
      console.error(`Attempt ${i + 1} failed:`, error);
      lastError = error;

      const isRateLimit = error.message?.includes("Rate limit exceeded");
      const waitTime = isRateLimit
        ? Math.min(1000 * Math.pow(2, i), 60000)
        : 1000 * (i + 1);

      await new Promise((resolve) => setTimeout(resolve, waitTime));

      if (i === maxRetries - 1 && isRateLimit) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
    }
  }

  throw lastError;
}

// Helper to split long content into chunks
export function splitContentIntoChunks(
  content: string,
  maxChunkSize: number = 500
): string[] {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if (
      (currentChunk + sentence).length > maxChunkSize &&
      currentChunk.length > 0
    ) {
      chunks.push(currentChunk.trim());
      currentChunk = "";
    }
    currentChunk += sentence;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
