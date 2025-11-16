// src/app/api/auctions/route.ts
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb"; // <-- This imports the file you just made
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  // 1. Check if user is logged in
  if (!session || !session.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // 2. CRITICAL: Check if user role is 'celebrity'
  // We cast the user object to access the role
  const userRole = (session.user as { role: string }).role;
  if (userRole !== "celebrity") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. If they are a celeb, create the auction
  try {
    const { title, startingBid, category, description, endDate } = await request.json();
    const userId = (session.user as { id: string }).id;

    if (!title || !startingBid) {
      return NextResponse.json(
        { error: "Title and Starting Bid are required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const newAuction = {
      title,
      bid: `₹${startingBid.toLocaleString()}`, // Format the starting bid
      bids: 0,
      startingBid: Number(startingBid),
      category,
      description,
      endDate: new Date(endDate),
      status: "live",
      createdAt: new Date(),
      createdBy: new ObjectId(userId), // Link to the celebrity
      bidsHistory: [],
    };

    const result = await db.collection("auctions").insertOne(newAuction);

    return NextResponse.json(
      { message: "Auction created", auctionId: result.insertedId },
      { status: 201 }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create auction" },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const auctions = await db
      .collection("auctions")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(
      auctions.map((auction) => ({
        _id: auction._id.toString(),
        title: auction.title,
        bid: auction.bid,
        bids: auction.bids,
      })),
      { status: 200 }
    );
  } catch (e) {
    console.error("Error fetching auctions:", e);
    return NextResponse.json(
      { error: "Failed to fetch auctions" },
      { status: 500 }
    );
  }
}