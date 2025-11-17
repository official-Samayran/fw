// src/app/api/auctions/route.ts
import { NextResponse, NextRequest } from "next/server";
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
    description: string; // detailed description
    shortDescription: string; // <--- ADDED
    bidIncrement: number; // <--- ADDED
    reservePrice: number | null; // <--- ADDED
    buyNowPrice: number | null; // <--- ADDED
    startDate: string; // <--- ADDED
    createdBy: ObjectId;
    bidsHistory: any[]; 
    createdAt: Date;
    titleImage: string | null;
}

/**
 * GET: Fetch a list of all auctions for the main auction page.
 * (Unchanged logic)
 */
export async function GET(request: NextRequest) { 
  try {
    const client = await clientPromise;
    const db = client.db(DATABASE_NAME);

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get("search");
    const createdBy = searchParams.get("createdBy");

    const query: Document = {};
    
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: "i" } }, 
        { description: { $regex: searchQuery, $options: "i" } }, 
        { category: { $regex: searchQuery, $options: "i" } } 
      ];
    }

    if (createdBy) {
        try {
            query.createdBy = new ObjectId(createdBy);
        } catch (e) {
            return NextResponse.json({ error: "Invalid createdBy user ID" }, { status: 400 });
        }
    }

    const auctions = await db
      .collection("auctions")
      .find(query) 
      .project({
        _id: 1,
        title: 1,
        bid: 1,
        bids: 1,
        currentHighBid: 1,
        endDate: 1,
        titleImage: 1, 
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedAuctions = auctions.map((auction) => ({
      ...auction,
      _id: auction._id.toString(),
      createdBy: auction.createdBy?.toString(),
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
 * POST: Create a new auction.
 * (Logic MODIFIED to accept and save new fields)
 */
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || (session.user as { role: string }).role !== "celebrity") {
        return NextResponse.json({ error: "Unauthorized. Only celebrities can create auctions." }, { status: 403 });
    }

    try {
        const { 
            title, 
            startingPrice,
            bidIncrement, // <--- NEW FIELD
            reservePrice, // <--- NEW FIELD
            buyNowPrice,  // <--- NEW FIELD
            startDate,    // <--- NEW FIELD
            category, 
            shortDescription, // <--- NEW FIELD
            detailedDescription,
            endDate, 
            titleImage 
        } = await request.json();

        // Renaming to match internal interface
        const startingBid = startingPrice; 
        const description = detailedDescription;

        // --- VALIDATION ---
        if (!title || !startingBid || !endDate || !bidIncrement || !description || !shortDescription || !startDate) {
            return NextResponse.json({ error: "Missing required fields: title, startingPrice, bidIncrement, endDate, shortDescription, or detailedDescription/description." }, { status: 400 });
        }
        
        const numericStartingBid = Number(startingBid);
        const numericBidIncrement = Number(bidIncrement);
        const numericReservePrice = reservePrice ? Number(reservePrice) : null;
        const numericBuyNowPrice = buyNowPrice ? Number(buyNowPrice) : null;
        
        if (isNaN(numericStartingBid) || numericStartingBid <= 0 || isNaN(numericBidIncrement) || numericBidIncrement <= 0) {
            return NextResponse.json({ error: "Starting Price and Bid Increment must be positive numbers." }, { status: 400 });
        }
        if (numericReservePrice !== null && isNaN(numericReservePrice)) {
            return NextResponse.json({ error: "Invalid Reserve Price." }, { status: 400 });
        }
        if (numericBuyNowPrice !== null && isNaN(numericBuyNowPrice)) {
            return NextResponse.json({ error: "Invalid Buy Now Price." }, { status: 400 });
        }
        // ------------------
        
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const userId = new ObjectId((session.user as { id: string }).id);
        
        const newAuction: AuctionDocument = {
            _id: new ObjectId(),
            title,
            // Core Pricing
            startingBid: numericStartingBid,
            currentHighBid: numericStartingBid, 
            bid: `₹${numericStartingBid.toLocaleString('en-IN')}`, 
            bidIncrement: numericBidIncrement, // <--- ADDED
            reservePrice: numericReservePrice, // <--- ADDED
            buyNowPrice: numericBuyNowPrice, // <--- ADDED
            // Content
            category: category || "Other",
            description: description, // detailed description
            shortDescription: shortDescription, // <--- ADDED
            titleImage: titleImage || null,
            // Timing
            startDate: new Date(startDate).toISOString(), // <--- ADDED
            endDate: new Date(endDate).toISOString(),
            // Metadata
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