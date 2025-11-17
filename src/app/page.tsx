// src/app/page.tsx
import TopPhilanthropists from "@/components/TopPhilanthropists";
import clientPromise from "@/lib/mongodb";
import Link from "next/link";
import { Document } from "mongodb";

// 1. Define the type for our auction data
interface Auction extends Document {
  _id: string;
  title: string;
  bid: string; // This is the formatted string, e.g., "₹4,300"
  bids: number;
  endDate: string;
}

/**
 * 2. Create a server-side function to fetch top auctions directly from MongoDB.
 * We'll get the 2 auctions ending soonest that are still live.
 */
async function getTopAuctions(): Promise<Auction[]> {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const now = new Date().toISOString();

    const auctions = await db
      .collection("auctions")
      .find({
        endDate: { $gt: now }, // Find auctions that are still live
      })
      .sort({ endDate: 1 }) // Sort by the ones ending soonest
      .limit(2) // Get the top 2
      .project({
        _id: 1,
        title: 1,
        bid: 1,
        bids: 1,
        endDate: 1,
      })
      .toArray();

    // Format the _id to be a string for React keys and props
    return auctions.map((auction) => ({
      ...auction,
      _id: auction._id.toString(),
    })) as unknown as Auction[];

  } catch (error) {
    console.error("Failed to fetch top auctions:", error);
    return []; // Return an empty array on error
  }
}

// 3. Make the HomePage component 'async' so we can 'await' our data
export default async function HomePage() {
  
  // 4. Fetch the dynamic data
  const topAuctions = await getTopAuctions();

  return (
    <div className="grid grid-cols-1 gap-10 pt-10 md:grid-cols-[1.6fr_1fr]">
      
      {/* LEFT SECTION (No changes here) */}
      <div>
        {/* HERO */}
        <h1 className="text-5xl font-extrabold leading-tight">
          Make Wishes Come True. <br />
          One Bid. One Act. One Impact.
        </h1>

        <p className="mt-3 text-lg text-[#6A6674]">
          Discover verified NGOs and meaningful auctions that change lives.
        </p>

        {/* SEARCH */}
        <div className="mt-6 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search auctions, NGOs, causes..."
            className="w-full rounded-xl border border-[#D5D0C7] bg-white px-4 py-3 text-sm shadow-sm"
          />

          <button className="rounded-xl bg-[#1E1635] px-5 py-3 text-sm font-semibold text-white hover:bg-[#463985]">
            Explore
          </button>
        </div>

        {/* CATEGORIES */}
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          {[
            "Trending",
            "Art",
            "Experiences",
            "Merchandise",
            "Children",
            "Healthcare",
            "Education",
          ].map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-white px-4 py-1.5 shadow-sm border border-[#E4E0DA]"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* SECTION TITLE */}
        <h2 className="mt-8 mb-3 text-2xl font-bold">Top Auctions</h2>

        {/* 5. DYNAMIC AUCTIONS GRID */}
        <div className="grid gap-5 sm:grid-cols-2">
          {topAuctions.length > 0 ? (
            topAuctions.map((auction) => (
              <Link // 6. Wrap card in a Link
                href={`/auction/${auction._id}`}
                key={auction._id}
                className="
                block
                rounded-2xl border border-[#E5E2DC] bg-white p-4 shadow-sm
                transition-all duration-300
                hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2F235A15]
                "
              >
                {/* LIVE BADGE */}
                <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                  🔴 LIVE
                </span>

                {/* IMAGE (Still a placeholder) */}
                <div className="h-28 w-full rounded-lg bg-gray-200" />

                {/* 7. Populate dynamic data */}
                <h3 className="mt-3 text-base font-semibold">
                  {auction.title}
                </h3>

                {/* DETAILS ROW */}
                <div className="mt-2 flex justify-between text-sm text-[#463985]">
                  <div>
                    <p className="text-xs text-gray-500">Current Bid</p>
                    <p className="font-bold">{auction.bid}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Bids</p>
                    <p className="font-bold">{auction.bids}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Ends In</p>
                    {/* Note: A true countdown requires a Client Component.
                      For a Server Component, we'll just show the date.
                    */}
                    <p className="font-bold">{new Date(auction.endDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            // 8. Show a message if no auctions are found
            <p className="text-gray-600 sm:col-span-2">
              No live auctions at the moment. Please check back soon!
            </p>
          )}
        </div>

        {/* NGOs SECTION (No changes here) */}
        <h2 className="mt-10 text-xl font-bold">Featured NGO Partners</h2>
        <p className="mt-2 max-w-2xl text-sm text-[#6A6674]">
          Famwish works with verified NGOs and organizations to ensure
          transparency and measurable impact for every auction.
        </p>

        <button className="mt-4 rounded-lg border px-4 py-2 text-sm hover:bg-white">
          View all NGOs →
        </button>
      </div>

      {/* RIGHT SIDEBAR (No changes here) */}
      <TopPhilanthropists />
    </div>
  );
}