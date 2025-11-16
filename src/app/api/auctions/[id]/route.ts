// src/app/api/auctions/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId, Db } from "mongodb";
import { getServerSession } from "next-auth/next"; // <-- ADDED
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // <-- ADDED

/**
 * Cached Mongo client for Next.js runtime to avoid connection explosion.
 */
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
 * Helper to normalize a Mongo document to JSON-friendly object
 */
function normalizeDoc(doc: any) {
  if (!doc) return doc;
  const copy: any = { ...doc };
  if (copy._id && typeof copy._id.toString === "function") copy._id = copy._id.toString();
  if (copy.createdBy && typeof copy.createdBy.toString === "function") copy.createdBy = copy.createdBy.toString();
  if (copy.topBidderId && typeof copy.topBidderId.toString === "function") copy.topBidderId = copy.topBidderId.toString();
  return copy;
}

/** GET /api/auctions/[id] */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { db } = await connectToDatabase();
    const { id } = await context.params;
    const oid = toObjectId(id);

    if (!oid) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const auction = await db.collection("auctions").findOne({ _id: oid });
    if (!auction) return NextResponse.json({ error: "Auction not found" }, { status: 404 });

    return NextResponse.json(normalizeDoc(auction), { status: 200 });
  } catch (err: any) {
    console.error("GET /api/auctions/[id] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

// --- START NEW POST FUNCTION FOR PLACING A BID ---
/** POST /api/auctions/[id] (Place Bid) */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated. Please log in to place a bid." }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const { id: auctionIdString } = await context.params;
    const auctionOid = toObjectId(auctionIdString);
    const userId = (session.user as { id: string, name: string }).id;
    const userName = (session.user as { id: string, name: string }).name;

    if (!auctionOid) {
      return NextResponse.json({ error: "Invalid auction ID" }, { status: 400 });
    }

    const { bidAmount } = await request.json();

    const newBidAmount = Number(bidAmount);
    if (isNaN(newBidAmount) || newBidAmount <= 0) {
        return NextResponse.json({ error: "Invalid bid amount provided." }, { status: 400 });
    }

    // 1. Find the current auction state
    const auction = await db.collection("auctions").findOne({ _id: auctionOid });

    if (!auction) {
        return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    const minBid = (auction.currentHighBid || auction.startingBid || 0) + 50;

    // 2. Validate the new bid
    if (newBidAmount < minBid) {
        return NextResponse.json(
            { error: `Bid must be at least ₹${minBid.toLocaleString('en-IN')}` },
            { status: 400 }
        );
    }
    
    // 3. Prepare the update document
    const bidHistoryEntry = {
        userId: userId,
        userName: userName,
        amount: newBidAmount,
        timestamp: new Date().toISOString(),
    };

    const updateDoc = {
        $set: {
            currentHighBid: newBidAmount,
            topBidderId: new ObjectId(userId),
            bid: `₹${newBidAmount.toLocaleString('en-IN')}` // For the list view
        },
        $push: { bidsHistory: bidHistoryEntry },
        $inc: { bids: 1 },
    };

    // 4. Perform the update
    const result = await db
      .collection("auctions")
      .findOneAndUpdate(
        { 
            _id: auctionOid,
            // Ensure we only update if no one has outbid us since we fetched the price (optimistic locking)
            currentHighBid: { $lt: newBidAmount }
        }, 
        updateDoc as any, 
        { 
            returnDocument: "after"
        }
      );

    if (!result || !result.value) {
      // This means the bid was too low or someone bid first
      return NextResponse.json({ error: "Bid was too low or outdated. Please try a higher amount." }, { status: 409 });
    }
    
    const updated = result.value;

    return NextResponse.json(
        { 
            message: "Bid placed successfully",
            newBid: bidHistoryEntry,
            auction: normalizeDoc(updated),
        }, 
        { status: 200 }
    );
  } catch (err: any) {
    console.error("POST /api/auctions/[id] (Place Bid) error:", err);
    return NextResponse.json({ error: err?.message || "Server error during bid process" }, { status: 500 });
  }
}
// --- END NEW POST FUNCTION ---


/** PUT /api/auctions/[id] */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // ... (PUT logic remains the same)
  try {
    const { db } = await connectToDatabase();
    const { id } = await context.params;
    const oid = toObjectId(id);

    if (!oid) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Prevent protected fields from being overwritten
    const { _id, createdAt, ...updates } = body;

    const result = await db
      .collection("auctions")
      .findOneAndUpdate({ _id: oid }, { $set: updates }, { returnDocument: "after" });

    if (!result || !result.value) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    const updated = result.value; 
    return NextResponse.json(normalizeDoc(updated), { status: 200 });

  } catch (err: any) {
    console.error("PUT /api/auctions/[id] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

/** DELETE /api/auctions/[id] */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  // ... (DELETE logic remains the same)
  try {
    const { db } = await connectToDatabase();
    const { id } = await context.params;
    const oid = toObjectId(id);

    if (!oid) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const result = await db.collection("auctions").deleteOne({ _id: oid });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/auctions/[id] error:", err);
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}