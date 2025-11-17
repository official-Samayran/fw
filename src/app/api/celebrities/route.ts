// src/app/api/celebrities/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Document } from "mongodb";

/**
 * GET: Fetches a list of all registered users with the 'celebrity' role.
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const celebrities: Document[] = await db.collection("users")
      .find({ role: 'celebrity' })
      .project({ _id: 1, name: 1, email: 1, profilePicture: 1 }) // Get necessary fields
      .toArray();

    // Map DB data to a cleaner format, including a mock follower count
    const formattedCelebrities = celebrities.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      // Using email as a handle placeholder
      desc: `Verified Celebrity: ${user.email}`,
      followers: Math.floor(Math.random() * 500) + 100, // Mock follower count
      profilePicture: user.profilePicture || null,
    }));

    return NextResponse.json(formattedCelebrities, { status: 200 });
  } catch (e) {
    console.error("Failed to fetch celebrities list:", e);
    return NextResponse.json(
      { error: "Failed to fetch celebrity list" },
      { status: 500 }
    );
  }
}