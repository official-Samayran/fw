// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Bell, Heart } from "lucide-react"; 
import ProfileDropdown from "./ProfileDropdown"; 

// We will import the new UserAvatar component in the dropdown component itself

// Define a type extension for the session user
interface ExtendedUser {
  name: string;
  role: string;
  image?: string | null;
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const [notificationCount, setNotificationCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    if (status === "authenticated") {
      const fetchCounts = async () => {
        
        // 1. Fetch Notification Count
        try {
          const notifRes = await fetch('/api/notifications/count');
          if (notifRes.ok) {
            const data = await notifRes.json();
            setNotificationCount(data.count);
          } else {
            console.error("Failed to fetch notification count with status:", notifRes.status);
          }
        } catch (error) {
          console.error("Critical error fetching notification count:", error);
        }

        // 2. Fetch Wishlist Count
        try {
          const wishRes = await fetch('/api/wishlist/count');
          if (wishRes.ok) {
            const data = await wishRes.json();
            setWishlistCount(data.count);
          } else {
            console.error("Failed to fetch wishlist count with status:", wishRes.status);
          }
        } catch (error) {
          console.error("Critical error fetching wishlist count:", error);
        }
      };
      
      fetchCounts();
    } else if (status === "unauthenticated") {
      setNotificationCount(0);
      setWishlistCount(0);
    }
  }, [status]); 

  const user = session?.user as ExtendedUser | undefined; 

  return (
    <header className="w-full border-b border-[#E6E3DD] bg-[#F6F3EC]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-extrabold text-2xl tracking-tight">
          famwish
        </Link>

        <div className="hidden gap-8 text-sm font-medium md:flex">
          <Link href="/" className="hover:text-[#4B3F72]">Home</Link>
          <Link href="/auction" className="hover:text-[#4B3F72]">Auctions</Link>
          <Link href="/leaderboard" className="hover:text-[#4B3F72]">Leaderboard</Link>
          <Link href="/ngos" className="hover:text-[#4B3F72]">NGOs</Link>
        </div>

        <div className="flex items-center gap-4"> 
          {isLoading ? (
            <div className="text-sm">Loading...</div>
          ) : session ? (
            // User is logged in
            <>
              {/* Notifications and Wishlist */}
              <Link href="/wishlist" className="relative text-gray-600 hover:text-black" title="Wishlist">
                <Heart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-pink-500 text-xs text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>
              <Link href="/notifications" className="relative text-gray-600 hover:text-black" title="Notifications">
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {notificationCount}
                  </span>
                )}
              </Link>

              {/* NEW PROFILE DROPDOWN */}
              <ProfileDropdown 
                userName={user?.name as string}
                userRole={user?.role}
                profilePictureUrl={user?.image as string | null}
              />

            </>
          ) : (
            // User is logged out
            <>
              {/* Log In / Sign Up Links */}
              <Link
                href="/auth"
                className="rounded-full border px-4 py-1.5 text-sm hover:bg-white"
              >
                Log in
              </Link>
              <Link
                href="/auth?tab=signup" 
                className="rounded-full bg-[#2F235A] px-4 py-1.5 text-sm text-white hover:bg-[#463985]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}