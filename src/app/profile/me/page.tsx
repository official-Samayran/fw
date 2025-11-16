// src/app/profile/me/page.tsx
"use client";

import { useState, useEffect } from "react"; 
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation"; 
import CreateAuctionModal from "@/components/CreateAuctionModal";
import UserAvatar from "@/components/UserAvatar"; // <-- IMPORTED

export default function MyProfilePage() {
  const { data: session, status } = useSession();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const router = useRouter(); 

  // --- 4. Handle redirection in a useEffect ---
  useEffect(() => {
    // If not authenticated (and not loading), redirect to home
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);
  // ----------------------------------------

  // 5. Handle loading and unauthenticated states gracefully
  // While redirecting or loading, show a loading message
  if (status === "loading" || status === "unauthenticated") {
    return <div className="text-center py-20">Loading...</div>;
  }
  
  // We are sure the user is authenticated here
  const user = session?.user as { 
    name: string; 
    role: string; 
    email: string 
  };

  // This should not be hit, but it's safe to keep
  if (!user) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <>
      {/* The Modal (it's hidden by default) */}
      <CreateAuctionModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <div className="pt-10 grid gap-8 md:grid-cols-[1.1fr_1.4fr]">
        
        {/* LEFT PANEL */}
        <div>
          {/* Profile Card */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-[#E8E3DB]">
            
            {/* --- UPDATED AVATAR DISPLAY --- */}
            <UserAvatar size="large" /> 
            {/* ---------------------------- */}

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">
              {user.name}
              {user.role === 'celebrity' && (
                <span className="text-sm text-yellow-600 font-semibold"> • VIP</span>
              )}
            </h1>

            <p className="text-sm text-gray-500">{user.email}</p>

            <p className="mt-3 text-sm text-gray-600 leading-relaxed">
              This is your personal profile page. You can update your bio here.
            </p>

            {/* Stats (we can wire these up later) */}
            <div className="grid grid-cols-3 gap-3 mt-5 text-center text-sm">
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">₹0</p>
                <p className="text-xs text-gray-600">Total raised</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">0</p>
                <p className="text-xs text-gray-600">Wishes fulfilled</p>
              </div>
              <div className="rounded-xl bg-[#FAF9F7] py-3 border border-[#E8E3DB]">
                <p className="font-bold">0</p>
                <p className="text-xs text-gray-600">NGOs supported</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100">
                Edit Profile
              </button>
              
              {user.role === 'celebrity' && (
                <button 
                  className="rounded-xl bg-[#F4C15D] px-4 py-2 text-sm font-semibold text-[#1E1635] hover:bg-[#e4b24e]"
                  onClick={() => setShowCreateModal(true)}
                >
                  + Create Auction
                </button>
              )}
              
            </div>
          </div>
        </div>

        {/* RIGHT PANEL (Your activity) */}
        <div>
          <div className="rounded-2xl bg-white px-8 py-7 shadow-sm border border-[#E8E3DB]">
            <h2 className="text-xl font-bold">Your Activity</h2>
            <p className="mt-3 text-sm text-gray-600">
              Your recent bids and created auctions will appear here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}