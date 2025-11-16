// src/app/api/auction/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";
import { ObjectId, UpdateFilter, Document } from "mongodb";

const MIN_INCREMENT = 50;
const DATABASE_NAME = process.env.MONGODB_DB;

interface Bid {
    userId: ObjectId;
    userName: string;
    amount: number;
    timestamp: Date;
}

interface AuctionDocument extends Document {
  _id: ObjectId;
  title: string;
  bid: string;
  currentHighBid: number;
  startingBid: number;
  bids: number;
  description: string;
  category: string;
  createdBy: ObjectId;
  endDate: Date;
  bidsHistory: Bid[]; 
  topBidderId?: ObjectId; 
  [key: string]: any; 
}

interface RouteContext {
    params: {
        id: string;
    }
}

/**
 * GET: Fetch a single auction and its bid history.
 */
export async function GET(
  request: Request,
  context: RouteContext
) {
  const { id } = context.params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid Auction ID" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const auction = await db.collection<AuctionDocument>("auctions").findOne({
      _id: new ObjectId(id),
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }
    
    const session = await getServerSession(authOptions);
    let isWishlisted = false;
    
    if (session && session.user) {
        const userId = (session.user as { id: string }).id;
        const wishlistCount = await db.collection("wishlists").countDocuments({
            userId: new ObjectId(userId),
            auctionId: new ObjectId(id),
        });
        isWishlisted = wishlistCount > 0;
    }

    return NextResponse.json({
      ...auction,
      _id: auction._id.toString(),
      createdBy: auction.createdBy.toString(),
      isWishlisted,
    });
  } catch (e) {
    // 🛑 CRITICAL LOGGING FOR DEBUGGING CONNECTION FAILURES
    console.error(`🛑 MongoDB connection or query failed for auction ID ${id}:`, e);
    return NextResponse.json(
      { error: "Failed to fetch auction details" },
      { status: 500 }
    );
  }
}

/**
 * POST: Place a new bid on an auction.
 */
export async function POST(
  request: Request,
  context: RouteContext
) {
  const { id } = context.params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "bidder") {
     return NextResponse.json({ error: "Forbidden. Only bidders can place bids." }, { status: 403 });
  }

  const { bidAmount } = await request.json();
  const userId = (session.user as { id: string }).id;
  const userName = (session.user as { name: string }).name || (session.user as { email: string }).email;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid Auction ID" }, { status: 400 });
  }
  if (!bidAmount || isNaN(Number(bidAmount)) || Number(bidAmount) <= 0) {
    return NextResponse.json({ error: "Invalid bid amount" }, { status: 400 });
  }

  const numericBid = Number(bidAmount);

  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);
    const auctionsCollection = db.collection<AuctionDocument>("auctions"); 

    const auction = await auctionsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!auction) {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    const currentHighBid = auction.bidsHistory?.[0]?.amount || auction.startingBid || 0;
    const minRequiredBid = currentHighBid + MIN_INCREMENT;

    if (numericBid < minRequiredBid) {
      return NextResponse.json(
        { error: `Bid must be at least ₹${minRequiredBid.toLocaleString('en-IN')}` },
        { status: 400 }
      );
    }
    
    const newBid: Bid = {
        userId: new ObjectId(userId),
        userName: userName,
        amount: numericBid,
        timestamp: new Date(),
    };

    const update: UpdateFilter<AuctionDocument> = {
        $set: {
          bid: `₹${numericBid.toLocaleString('en-IN')}`, 
          currentHighBid: numericBid, 
          topBidderId: new ObjectId(userId),
        },
        $inc: {
          bids: 1, 
        },
        $push: { 
          bidsHistory: {
            $each: [newBid],
            $position: 0, 
          },
        } as any, 
    };
    
    const result = await auctionsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      update,
      { returnDocument: "after" }
    );

    if (!result || !result.value) {
        return NextResponse.json({ error: "Failed to place bid due to concurrency or update issue." }, { status: 500 });
    }

    const updatedAuction = result.value as AuctionDocument;

    return NextResponse.json({ message: "Bid placed successfully", newBid: updatedAuction.bidsHistory?.[0] });

  } catch (e) {
    console.error("Error placing bid:", e);
    return NextResponse.json(
      { error: "Failed to place bid" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}