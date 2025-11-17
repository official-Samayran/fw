// src/components/LeaderboardMain.tsx
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; // Correct import
import { Celeb } from "@/types";
import { Fan } from "@/lib/generateFans";
import StickyRank from "./StickyRank";
import TopThree from "./TopThree";
import FanList from "./FanList";
import { showToast } from "@/utils/toast";

interface Props {
  selectedCeleb: Celeb;
  timeframe: "week" | "month" | "year" | "all";
  mode: "celeb" | "global";
}

export default function LeaderboardMain({ selectedCeleb, timeframe, mode }: Props) {
  // --- FIX: Destructure data (as session) AND status from useSession ---
  const { data: session, status } = useSession(); 
  // ---------------------------------------------------------------------

  const [fans, setFans] = useState<Fan[]>([]);
  const [page, setPage] = useState(1);
  const [you, setYou] = useState<Fan | null>(null);
  const [loading, setLoading] = useState(true);

  const pageSize = 10;
  
  // Use real user data or safe fallbacks for UI
  const userId = (session?.user as { id: string })?.id || "guest"; // Real ID if authenticated
  const userName = session?.user?.name || "You";

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      setPage(1); // Reset pagination
      let endpoint = '';
      
      if (mode === "global") {
        endpoint = `/api/leaderboard/global?timeframe=${timeframe}`;
      } else {
        endpoint = `/api/leaderboard/celeb?celebId=${selectedCeleb.id}&timeframe=${timeframe}`;
      }

      let generatedFans: Fan[] = [];

      try {
          const res = await fetch(endpoint);
          if (!res.ok) {
            throw new Error(`Failed to fetch ${mode} leaderboard`);
          }
          const data: Fan[] = await res.json();
          generatedFans = data;
      } catch (err) {
        console.error(err);
        generatedFans = [];
      }

      setFans(generatedFans);

      const topPoints = generatedFans[0]?.points || 500;
      setYou({ 
        id: userId,
        name: userName,
        // Use status here: only give points if authenticated
        points: status === 'authenticated' ? Math.round(topPoints / 4) : 0, 
        bids: 0, 
        wishes: 0 
      });

      setLoading(false);
    };

    fetchLeaderboard();
    
    // --- FIX: Use 'status' directly in the dependency array ---
  }, [selectedCeleb, timeframe, mode, status, userId, userName]); 
    // ----------------------------------------------------------

  const filteredFans = fans.filter(f => f.id !== userId);
  const combined = session && you ? [you, ...filteredFans] : filteredFans; 
  combined.sort((a, b) => b.points - a.points);

  const rank = session ? (combined.findIndex((f) => f.id === userId) + 1) : null; 
  const paginatedFans = combined.slice(0, page * pageSize);

  const onChallenge = (fan: Fan) => {
    if (status !== 'authenticated') { // Check status for authentication
        showToast("You must be logged in to challenge other fans.");
        return;
    }
    const gain = Math.round(50 + Math.random() * 350);
    const updatedYou = { ...you!, points: you!.points + gain, bids: you!.bids + 1 };

    showToast(`You gained +${gain} pts vs ${fan.name}!`);
    setYou(updatedYou);
  };

  return (
    <div>
      {/* Sticky Rank is only shown if authenticated */}
      {status === 'authenticated' && <StickyRank rank={rank || null} celebName={selectedCeleb.name} points={you?.points || 0} />}

      <div className="p-6 rounded-xl bg-white border shadow mb-4 flex justify-between mt-4">
        <div>
          <h2 className="font-bold text-lg text-[#22163F]">
            {mode === "global"
              ? "Global Top Bidders"
              : `${selectedCeleb.name} — Fan Leaderboard`}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "global"
              ? "Top bidders across all celebrities (Real Data)"
              : selectedCeleb.desc}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Leaderboard timeframe</p>
          <p className="font-semibold">{labelMap[timeframe]}</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center p-10 font-semibold">Loading Leaderboard...</div>
      ) : (
        <>
          <TopThree fans={combined.slice(0, 3)} />
          <FanList fans={paginatedFans} onChallenge={onChallenge} yourId={userId} /> 

          {paginatedFans.length < combined.length && (
            <button
              onClick={() => setPage(page + 1)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold"
            >
              Load more fans ↓
            </button>
          )}
        </>
      )}
    </div>
  );
}

const labelMap = {
  week: "This Week",
  month: "This Month",
  year: "This Year",
  all: "All Time",
};