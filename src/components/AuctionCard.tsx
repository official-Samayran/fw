// src/components/AuctionCard.tsx
"use client";

import Link from "next/link";
import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Heart } from "lucide-react";

interface Auction {
  _id: string;
  title: string;
  bid: string;
  bids: number;
  endDate: string;
  // --- ADDED IMAGE FIELD ---
  titleImage?: string | null; // Base64 or URL
  // -------------------------
}

interface Props {
  auction: Auction;
  isInitiallyWishlisted: boolean;
}

// --- REMOVED: safeFormatDate helper is unnecessary with suppressHydrationWarning ---

// Function now inline or removed, relying on standard Date/Locale methods.

export default function AuctionCard({ auction, isInitiallyWishlisted }: Props) {
  
  const { data: session } = useSession();
  const [isWishlisted, setIsWishlisted] = useState(isInitiallyWishlisted);

  const handleWishlistToggle = useCallback(async () => {
    if (!session) {
      alert("Please log in to add items to your wishlist.");
      return;
    }

    const currentWishlistStatus = isWishlisted;
    setIsWishlisted(!currentWishlistStatus);

    try {
      await fetch("/api/wishlist", {
        method: currentWishlistStatus ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auctionId: auction._id }),
      });
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      setIsWishlisted(currentWishlistStatus);
    }
  }, [isWishlisted, session, auction._id]);

  return (
    <div
      className="
        rounded-2xl border border-[#E5E2DC] bg-white p-4 shadow-sm
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl hover:shadow-[#2F235A15]
        flex flex-col
      "
    >
      {/* LIVE BADGE */}
      <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
        🔴 LIVE
      </span>

      {/* Image and Wishlist Button Container */}
      <div className="relative">
        <Link href={`/auction/${auction._id}`} className="block">
          {/* --- MODIFIED: Use titleImage or fallback --- */}
          {auction.titleImage ? (
            <img
              src={auction.titleImage}
              alt={auction.title}
              className="h-28 w-full rounded-lg object-cover"
            />
          ) : (
            <div className="h-28 w-full rounded-lg bg-gray-200" />
          )}
          {/* ------------------------------------------- */}
        </Link>
        
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full transition-colors
                      ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-400 bg-white/50'}`}
        >
          <Heart
            size={20}
            fill={isWishlisted ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Card Content - also a link */}
      <Link href={`/auction/${auction._id}`} className="block flex-1 flex flex-col mt-3">
        <h3 className="text-base font-semibold">
          {auction.title}
        </h3>

        {/* Details Row */}
        <div className="mt-2 flex justify-between text-sm text-[#463985] flex-1 items-end">
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
            {/* FIX: Use toLocaleDateString directly since warning suppression is enabled */}
            <p className="font-bold" suppressHydrationWarning={true}>
              {new Date(auction.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}