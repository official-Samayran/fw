// src/app/api/follow/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

/**
 * GET /api/follow
 * Fetches all celebrities the authenticated user is following (used for initial state).
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    // Return empty list if not logged in
    return NextResponse.json([], { status: 200 }); 
  }

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    const userId = new ObjectId((session.user as { id: string }).id);

    const followed = await db.collection("follows")
        .find({ followerId: userId })
        .project({ _id: 0, followingId: 1 })
        .toArray();

    // Map ObjectId to string
    const formattedFollows = followed.map(f => ({
        followingId: f.followingId.toString()
    }));

    return NextResponse.json(formattedFollows, { status: 200 });
  } catch (e) {
    console.error("Follow GET API error:", e);
    return NextResponse.json({ error: "Server error fetching follow status" }, { status: 500 });
  }
}

/**
 * POST /api/follow
 * Toggles a follow relationship between the authenticated user and the targetId (celebrity).
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { targetId } = await request.json(); // The ID of the celebrity being followed
    if (!targetId) {
      return NextResponse.json({ error: "Missing targetId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    
    const userId = new ObjectId((session.user as { id: string }).id);
    const targetOid = new ObjectId(targetId);

    // 1. Check if relationship exists
    const query = { followerId: userId, followingId: targetOid };
    const existingFollow = await db.collection("follows").findOne(query);

    let isFollowing: boolean;

    if (existingFollow) {
      // 2. If already following, unfollow (DELETE)
      await db.collection("follows").deleteOne(query);
      isFollowing = false;
    } else {
      // 3. If not following, follow (INSERT)
      await db.collection("follows").insertOne({
        ...query,
        createdAt: new Date(),
      });
      isFollowing = true;
    }

    return NextResponse.json(
      { message: isFollowing ? "Followed successfully" : "Unfollowed successfully", isFollowing },
      { status: 200 }
    );
  } catch (e) {
    console.error("Follow API error:", e);
    return NextResponse.json({ error: "Server error toggling follow status" }, { status: 500 });
  }
}