"use client";

import { useState, useEffect } from "react";

interface Auction {
  _id: string;
  title: string;
  bid: string;
  bids: number;
}

export default function AuctionsPage() {
  const [activeCategory, setActiveCategory] = useState("Live");
  const [activeFilter, setActiveFilter] = useState("Popular");

  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categories = [
    "Live",
    "Ending Soon",
    "Most Bid",
    "Art",
    "Experiences",
    "Merchandise",
    "Charity",
    "NGOs",
  ];

  const filters = ["Popular", "Highest Bids", "Newest", "Ending Soon", "Recommended"];

  const trending = [
    { title: "Signed Guitar", bid: "₹3,800", bids: 12 },
    { title: "Vintage Art", bid: "₹4,300", bids: 32 },
    { title: "Cricket Kit (Signed)", bid: "₹2,420", bids: 8 },
  ];

  useEffect(() => {
    async function getAuctions() {
      try {
        setLoading(true);
        const res = await fetch("/api/auctions");
        if (!res.ok) throw new Error("Failed to fetch auctions");

        const data = await res.json();
        setAuctions(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load auctions at the moment. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    getAuctions();
  }, [activeCategory]);

  return (
    <div className="grid grid-cols-1 gap-10 px-10 py-10 lg:grid-cols-[2fr_0.9fr]">

      <div>
        {/* CATEGORY PILLS */}
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-5 py-1.5 text-sm border transition-all ${
                activeCategory === cat
                  ? "bg-[#E7E1F6] text-[#2F235A] font-semibold border-[#D6CCE8]"
                  : "border-[#E3DDD5] hover:bg-[#F7F4FF]"
              }`}
            >
              {cat === "Live" && <span className="mr-1 text-red-500">🔴</span>}
              {cat}
            </button>
          ))}
        </div>

        {/* FILTER TABS */}
        <div className="mt-6 flex gap-8 text-sm font-medium">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`pb-1 transition-all ${
                activeFilter === f
                  ? "text-[#2F235A] border-b-2 border-[#2F235A] font-semibold"
                  : "text-gray-500 hover:text-black"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* AUCTION GRID */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p>Loading auctions...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : auctions.length === 0 ? (
            <p>No auctions found.</p>
          ) : (
            auctions.map((auction) => (
              <div
                key={auction._id}
                className="rounded-xl border border-[#E8E4DD] bg-white shadow-sm p-0.5 
                hover:-translate-y-1 hover:shadow-lg transition duration-200"
              >
                <div className="relative">
                  <span className="absolute top-3 left-3 rounded-full bg-red-100 px-2 py-[2px] text-[11px] font-semibold text-red-600">
                    LIVE
                  </span>
                  <span className="absolute top-3 right-3 h-7 w-7 text-[#C8B9E8] text-xl flex items-center justify-center">
                    ♡
                  </span>
                  <div className="h-36 w-full rounded-lg bg-gray-200"></div>
                </div>

                <div className="px-3 py-3">
                  <h3 className="font-bold text-[14px] leading-tight">{auction.title}</h3>
                  <div className="mt-2 flex justify-between text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Current Bid</p>
                      <p className="font-bold">{auction.bid}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Bids</p>
                      <p className="font-bold">{auction.bids}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* TRENDING AUCTIONS (still mock data) */}
        <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
          <h3 className="flex items-center gap-1 font-bold text-lg">
            🔥 Trending Auctions
          </h3>

          <div className="mt-4 flex flex-col gap-5">
            {trending.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-gray-200" />
                <div>
                  <p className="font-semibold text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500">
                    {item.bid} · {item.bids} bids
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECOMMENDED */}
        <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
          <h3 className="font-bold text-lg flex items-center gap-1">
            ⭐ Recommended for you
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Based on your wishlist.
          </p>
        </div>

        {/* RECENTLY VIEWED */}
        <div className="rounded-2xl bg-white p-5 shadow border border-[#E5E1DB]">
          <h3 className="font-bold text-lg flex items-center gap-1">
            ⏰ Recently Viewed
          </h3>
          <p className="text-sm text-gray-500 mt-1">Nothing yet.</p>
        </div>
      </div>
    </div>
  );
}
