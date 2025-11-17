// src/components/Sidebar.tsx
"use client";

import { Celeb } from "@/types";
import { useState, useEffect, useCallback } from "react"; 
import { useSession } from "next-auth/react"; 
import { User, Rss, ArrowRight, Check } from "lucide-react"; 
import { showToast } from "@/utils/toast";
import Link from "next/link"; 
import { cn } from "@/utils/cn";

interface Props {
  celebs: Celeb[];
  selected: Celeb;
  mode: "celeb" | "global";
  followStatus: boolean; // <--- ADDED: Current follow status for the selected celeb
}

export default function Sidebar({ selected, mode, followStatus }: Props) {
  const { status } = useSession(); 
  const [heat, setHeat] = useState(0);
  // Use followStatus passed from parent as initial state
  const [isFollowing, setIsFollowing] = useState(followStatus); 
  const [loadingFollow, setLoadingFollow] = useState(false);
  
  // Update local state when parent prop changes
  useEffect(() => {
    setIsFollowing(followStatus);
  }, [followStatus]);

  useEffect(() => {
    const randomHeat = Math.floor(40 + Math.random() * 50);
    setHeat(randomHeat);
  }, [selected, mode]); 

  const isGlobal = mode === "global";
  
  // 2. Handle the Follow Toggle using the new API
  const handleFollowToggle = async () => {
    if (status !== 'authenticated') {
        showToast("Please log in to follow celebrities.");
        return;
    }
    setLoadingFollow(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing); // Optimistic UI update

    try {
        // POST request toggles the status via the new API
        const res = await fetch("/api/follow", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetId: selected.id }),
        });
        
        if (!res.ok) {
            throw new Error(`Failed to ${wasFollowing ? 'unfollow' : 'follow'}.`);
        }
        
        showToast(wasFollowing ? `Unfollowed ${selected.name}` : `Following ${selected.name}!`);

    } catch (e) {
        showToast(`Error: Follow status update failed.`);
        setIsFollowing(wasFollowing); // Rollback
    } finally {
        setLoadingFollow(false);
    }
  };


  return (
    <aside className="space-y-4 sticky top-6">
      
      {/* Target Celeb Info */}
      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <p className="text-sm text-gray-500">
          {isGlobal ? "Overall Community Heat" : "Selected Celebrity"}
        </p>
        <p className="font-bold text-[#22163F] text-xl">
          {isGlobal ? "Global" : selected.name}
        </p>
        {!isGlobal && (
          <div className="mt-2 text-sm text-gray-700">
            <p className="font-medium">{selected.desc}</p>
            <p className="text-xs text-gray-500 mt-2">
              <span className="font-bold">{selected.followers.toLocaleString()}</span> followers
            </p>
          </div>
        )}
      </div>

      {/* Leaderboard Heat (Unchanged) */}
      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <p className="text-sm text-gray-500">Leaderboard Heat</p>
        <p className="font-bold">{heat}%</p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-orange-400 h-full rounded-full transition-all duration-500" 
            style={{ width: `${heat}%` }} 
          />
        </div>
      </div>

      {/* Quick Actions (Follow Button) */}
      <div className="p-4 bg-white border rounded-xl shadow-sm">
        <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Rss size={20} className="text-[#22163F]" /> Quick Actions
        </h4>
        
        {/* Follow/Unfollow Button */}
        {!isGlobal && (
            <button 
                onClick={handleFollowToggle}
                disabled={loadingFollow || status !== 'authenticated'}
                className={cn(
                    "w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition",
                    isFollowing 
                        ? "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200" 
                        : "bg-[#22163F] text-white hover:bg-[#463985]",
                    (loadingFollow || status !== 'authenticated') && "opacity-50 cursor-not-allowed"
                )}
            >
                {loadingFollow ? 'Updating...' : (
                    isFollowing ? (
                        <> <Check size={16} /> Following </>
                    ) : (
                        <> <User size={16} /> Follow {selected.name} </>
                    )
                )}
            </button>
        )}
        
        {/* Go to Profile Button */}
        <Link 
            href={isGlobal ? "/profile/me" : `/profile/${selected.id}`}
            className="mt-2 w-full py-2 border rounded-lg hover:bg-gray-100 font-semibold flex items-center justify-center gap-2 transition"
        >
            View {isGlobal ? "Your Profile" : "Celeb Profile"} <ArrowRight size={16} />
        </Link>

        <button 
            className="mt-2 w-full py-2 border rounded-lg hover:bg-gray-100 font-semibold"
            onClick={() => alert("Notification settings opened!")}
        >
            Notify for auctions
        </button>
      </div>
    </aside>
  );
}