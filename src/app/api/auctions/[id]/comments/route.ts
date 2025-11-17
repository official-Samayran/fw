// src/app/api/auctions/[id]/comments/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Db, MongoClient } from "mongodb";

// --- CONNECTION CACHING (Copied from src/app/api/auctions/[id]/route.ts) ---
let cached: { client: MongoClient; db: Db } | undefined;

async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cached) return cached;

  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set.");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const dbName = process.env.MONGODB_DB || "famwish";
  const db = client.db(dbName);

  cached = { client, db };
  return cached;
}
// --------------------------------------------------------------------------

/**
 * Safely convert string id to ObjectId. Returns null if invalid.
 */
function toObjectId(id?: string): ObjectId | null {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/**
 * GET /api/auctions/[id]/comments
 * Fetches all comments for a specific auction, sorted by newest first.
 * * FIX: 'context.params' is awaited.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // params is a Promise
): Promise<NextResponse> {
  try {
    const { db } = await connectToDatabase();
    // ✅ AWAIT the context.params object before accessing 'id'
    const resolvedParams = await context.params;
    const auctionId = resolvedParams.id;
    const auctionOid = toObjectId(auctionId);

    if (!auctionOid) {
      return NextResponse.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    const comments = await db.collection("auction_comments")
      .find({ auctionId: auctionOid })
      .sort({ createdAt: -1 }) // Newest first
      .limit(50) // Limit the number of comments to fetch
      .toArray();

    // Convert ObjectId to string for safe JSON serialization
    const serializedComments = comments.map(comment => ({
        ...comment,
        _id: comment._id.toString(),
        auctionId: comment.auctionId.toString(),
        userId: comment.userId.toString(),
    }));

    return NextResponse.json(serializedComments, { status: 200 });
  } catch (err) {
    console.error("GET /api/auctions/[id]/comments error:", err);
    return NextResponse.json({ error: "Server error fetching comments" }, { status: 500 });
  }
}

/**
 * POST /api/auctions/[id]/comments
 * Adds a new comment to the auction. Requires authentication.
 * * FIX: 'context.params' is awaited.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // params is a Promise
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated. Please log in to comment." }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const { text } = await request.json();
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Comment text is empty" }, { status: 400 });
    }

    // ✅ AWAIT the context.params object before accessing 'id'
    const resolvedParams = await context.params;
    const auctionId = resolvedParams.id;
    const auctionOid = toObjectId(auctionId);
    
    const userId = (session.user as { id: string, name: string }).id;
    const userName = (session.user as { id: string, name: string }).name;

    if (!auctionOid) {
      return NextResponse.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    const newComment = {
      auctionId: auctionOid,
      userId: new ObjectId(userId),
      userName: userName,
      text: text.trim(),
      createdAt: new Date(),
    };

    const result = await db.collection("auction_comments").insertOne(newComment);

    return NextResponse.json(
      { message: "Comment posted successfully", commentId: result.insertedId.toString() },
      { status: 201 }
    );

  } catch (err) {
    console.error("POST /api/auctions/[id]/comments error:", err);
    return NextResponse.json({ error: "Server error posting comment" }, { status: 500 });
  }
}