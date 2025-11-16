// src/app/api/auctions/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { Document, ObjectId } from "mongodb";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const DATABASE_NAME = process.env.MONGODB_DB;

interface AuctionDocument extends Document {
    _id: ObjectId;
    title: string;
    bid: string;
    bids: number;
    currentHighBid: number;
    startingBid: number;
    endDate: string;
    category: string;
    description: string;
    createdBy: ObjectId;
    bidsHistory: any[]; 
    createdAt: Date;
}

/**
 * GET: Fetch a list of all auctions for the main auction page.
 */
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const auctions = await db
      .collection("auctions")
      .find({})
      .project({
        _id: 1,
        title: 1,
        bid: 1,
        bids: 1,
        currentHighBid: 1,
        endDate: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedAuctions = auctions.map((auction) => ({
      ...auction,
      _id: auction._id.toString(),
    }));

    return NextResponse.json(formattedAuctions, { status: 200 });
  } catch (e) {
    console.error("Error fetching auctions list:", e);
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new auction (Used by CreateAuctionModal.tsx).
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as { role: string }).role !== "celebrity") {
        return NextResponse.json({ error: "Unauthorized. Only celebrities can create auctions." }, { status: 403 });
    }

    try {
        const { title, startingBid, category, description, endDate } = await request.json();

        if (!title || !startingBid || !endDate) {
            return NextResponse.json({ error: "Missing required fields: title, starting bid, or end date." }, { status: 400 });
        }
        
        const numericBid = Number(startingBid);
        if (isNaN(numericBid) || numericBid <= 0) {
            return NextResponse.json({ error: "Starting bid must be a positive number." }, { status: 400 });
        }
        
        const client = await clientPromise;
        const db = client.db(DATABASE_NAME);
        const userId = new ObjectId((session.user as { id: string }).id);
        
        const newAuction: AuctionDocument = {
            _id: new ObjectId(),
            title,
            startingBid: numericBid,
            currentHighBid: numericBid, 
            bid: `₹${numericBid.toLocaleString('en-IN')}`, 
            category: category || "Other",
            description: description || "",
            endDate: new Date(endDate).toISOString(),
            createdBy: userId,
            bids: 0,
            bidsHistory: [],
            createdAt: new Date(),
        };

        const result = await db.collection("auctions").insertOne(newAuction);

        return NextResponse.json(
            { message: "Auction created successfully", auctionId: result.insertedId.toString() },
            { status: 201 }
        );

    } catch (e) {
        console.error("Error creating auction:", e);
        return NextResponse.json(
            { error: "Failed to create auction" },
            { status: 500 }
        );
    }
}