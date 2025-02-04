import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({
        success: false,
        error: "Search query is required",
      });
    }

    const articles = await prisma.article.findMany({
      where: {
        translations: {
          some: {
            language: "he",
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { summary: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        translations: {
          where: {
            language: "he",
          },
        },
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
    });
  } catch (error) {
    console.error("Error searching articles:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
