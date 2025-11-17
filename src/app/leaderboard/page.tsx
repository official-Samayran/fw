// src/app/leaderboard/page.tsx
"use client";

import { useState, useEffect, Suspense, useCallback } from "react"; 
import { useSession } from "next-auth/react"; 
import CelebrityStrip from "@/components/CelebrityStrip";
import TimeFilters from "@/components/TimeFilters";
import ModeSwitch from "@/components/ModeSwitch";
import LeaderboardMain from "@/components/LeaderboardMain";
import Sidebar from "@/components/Sidebar";
import { Celeb } from "@/types"; 

// --- NEW Data Fetching Component (Client Fetch) ---
function LeaderboardClientWrapper() {
  const { data: session, status } = useSession(); 
  
  const [celebs, setCelebs] = useState<Celeb[]>([]);
  const [selectedCeleb, setSelectedCeleb] = useState<Celeb | null>(null);
  const [followStatusMap, setFollowStatusMap] = useState<Set<string>>(new Set()); 
  const [loading, setLoading] = useState(true);

  const [timeframe, setTimeframe] = useState<"week" | "month" | "year" | "all">("week");
  const [mode, setMode] = useState<"celeb" | "global">("celeb");
  
  // Fetch follow status whenever auth state changes
  const fetchFollowStatus = useCallback(async (isAuth: boolean) => {
    if (!isAuth) {
        setFollowStatusMap(new Set());
        return;
    }
    
    try {
        const followRes = await fetch(`/api/follow`); 
        
        if (followRes.ok) {
            const data = await followRes.json();
            const ids: Set<string> = new Set(data.map((f: any) => f.followingId as string)); 
            setFollowStatusMap(ids);
        } else {
            setFollowStatusMap(new Set());
        }
    } catch (e) {
        console.error("Failed to fetch follow status:", e);
        setFollowStatusMap(new Set());
    }
  }, []);


  // Fetch initial data: Celebrities and Follow Status
  useEffect(() => {
    async function fetchInitialData() {
      setLoading(true); 
      try {
        // Fetch all registered celebrities
        const celebRes = await fetch("/api/celebrities");
        const celebData: Celeb[] = celebRes.ok ? await celebRes.json() : [];
        
        setCelebs(celebData);
        
        // --- FIX: Safely set selectedCeleb using the previous state (prev) ---
        // This ensures the logic only runs when celebData changes, not on every render.
        setSelectedCeleb(prev => {
            if (celebData.length > 0 && prev === null) {
                return celebData[0];
            }
            return prev;
        });
        // -------------------------------------------------------------------
        
        // Fetch follow status based on the current auth status
        await fetchFollowStatus(status === 'authenticated');

      } catch (e) {
        console.error("Failed to load initial leaderboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    
    // Depend on 'status' to re-run everything on login/logout
  }, [status, fetchFollowStatus]); // Removed selectedCeleb from deps to avoid confusing the dependency array
  
  
  // Handlers for selection
  const handleSelectCeleb = (celeb: Celeb) => {
    setSelectedCeleb(celeb);
    setMode("celeb");
  }

  // --- Loading/Empty State Handling ---
  if (loading) {
    return <div className="text-center py-20 text-xl text-[#22163F]">Loading Celebrities...</div>;
  }
  
  if (celebs.length === 0) {
    return <div className="text-center py-20 text-xl text-gray-500">No celebrities registered yet.</div>;
  }
  
  // Ensure currentCeleb is the selected one, or the first one in the list
  const currentCeleb = selectedCeleb || celebs[0]; 
  // ----------------------------------------

  return (
    <div className="max-w-[1250px] mx-auto px-5 pt-10 pb-10">

    {/* CELEBRITY STRIP */}
    <div>
      <div className="flex justify-between items-end mb-3">
        <h2 className="font-extrabold text-[22px] text-[#22163F]">
          Choose a celebrity
        </h2>
        <p className="text-[13px] text-[#6B6B6B]">
          Click a celeb to open their fan leaderboard
        </p>
      </div>

      <CelebrityStrip
        celebs={celebs}
        selected={currentCeleb}
        onSelect={handleSelectCeleb}
      />
    </div>

      {/* FILTER CONTROLS */}
      <div className="flex justify-between items-center mt-6">
        <TimeFilters value={timeframe} onChange={setTimeframe} />
        <ModeSwitch value={mode} onChange={setMode} />
      </div>

      {/* MAIN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mt-6">
        <LeaderboardMain
          selectedCeleb={currentCeleb}
          timeframe={timeframe}
          mode={mode}
        />
        {/* Pass followStatus prop to the Sidebar */}
        <Sidebar
          celebs={celebs}
          selected={currentCeleb}
          mode={mode}
          followStatus={followStatusMap.has(currentCeleb.id)} // Pass follow status
        />
      </div>
    </div>
  );
}


export default function LeaderboardPage() {
    return (
        <Suspense fallback={<div className="text-center py-20">Loading Initial Data...</div>}>
            <LeaderboardClientWrapper />
        </Suspense>
    );
}