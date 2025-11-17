// src/app/api/leaderboard/celeb/route.ts
import { NextRequest, NextResponse } from "next/server";
import { generateFans } from "@/lib/generateFans";
import { celebs } from "@/lib/mockData";

/**
 * GET: Serves the mock celebrity fan leaderboard data.
 * This endpoint ensures the client component only relies on API endpoints.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const celebId = searchParams.get("celebId");
    const timeframe = (searchParams.get("timeframe") || "week") as "week" | "month" | "year" | "all";
    
    if (!celebId) {
        return NextResponse.json({ error: "Missing celebId parameter" }, { status: 400 });
    }

    const celeb = celebs.find(c => c.id === celebId);

    if (!celeb) {
        return NextResponse.json({ error: "Celebrity not found" }, { status: 404 });
    }

    // Generate the mock data using the existing library function
    const fans = generateFans(celeb, timeframe, 100);

    return NextResponse.json(fans, { status: 200 });

  } catch (e) {
    console.error("Error fetching celebrity leaderboard mock data:", e);
    return NextResponse.json(
      { error: "Failed to generate leaderboard data" },
      { status: 500 }
    );
  }
}