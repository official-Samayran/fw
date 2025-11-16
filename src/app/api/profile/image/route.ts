// src/app/api/profile/image/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/profile/image
 * Fetches the current user's profile picture (Base64 string) from MongoDB.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as { id: string }).id) {
    // This should not happen if the session is small enough to load
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    // We only need the user ID, which is small and safe in the session
    const userId = (session.user as { id: string }).id;

    // Find the user document, only getting the profilePicture field
    const user = await db.collection("users").findOne(
      { _id: new ObjectId(userId) },
      { projection: { profilePicture: 1 } }
    );

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profilePicture = user.profilePicture || null;

    // We return the raw Base64 string. The browser will handle displaying it.
    // The response body can be large; the header (cookie) is the small part.
    return NextResponse.json({ profilePicture }, { status: 200 });
  } catch (e) {
    console.error("Failed to fetch profile image:", e);
    return NextResponse.json(
      { error: "Server error fetching image" },
      { status: 500 }
    );
  }
}