// src/components/UserAvatar.tsx
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { User } from "lucide-react";

interface Props {
  size: 'small' | 'large';
}

/**
 * Component to fetch and display the user's profile picture, preventing the large
 * Base64 string from being stored in the session/JWT.
 */
export default function UserAvatar({ size }: Props) {
  const { data: session, status } = useSession();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  
  const userName = session?.user?.name || "User";
  const userId = (session?.user as { id: string })?.id;

  // 1. Fetch the image data once authenticated
  useEffect(() => {
    if (status === "authenticated" && userId) {
      async function fetchImage() {
        try {
          // Fetch the Base64 string from our new dedicated API route (Step 3)
          const res = await fetch("/api/profile/image");
          
          if (!res.ok) {
            console.error("Failed to fetch image with status:", res.status);
            throw new Error("Failed to fetch image");
          }
          
          const data = await res.json();
          // The API will return { profilePicture: "data:image/..." }
          setProfilePictureUrl(data.profilePicture);
        } catch (e) {
          console.error("Image fetch error:", e);
        }
      }
      fetchImage();
    }
  }, [status, userId]);

  // 2. Determine CSS classes based on size prop
  let sizeClasses = "h-8 w-8";
  
  if (size === 'large') {
    sizeClasses = "h-20 w-20 text-3xl border-4 border-white shadow-md";
  }

  // 3. Render Logic
  if (profilePictureUrl) {
    return (
        <img 
            src={profilePictureUrl} 
            alt={`${userName}'s profile`} 
            className={`rounded-full object-cover flex-shrink-0 ${sizeClasses}`} 
        />
    );
  }

  // Fallback (when loading or if no picture exists)
  return (
    <div 
        className={`rounded-full bg-gray-300 font-bold flex items-center justify-center bg-gradient-to-br from-[#F4C15D] to-[#D9A441] text-white ${sizeClasses}`}
    >
        {/* Show initials or a loading icon */}
        {status === 'loading' ? <User size={size === 'large' ? 30 : 18} /> : userName.charAt(0).toUpperCase()}
    </div>
  );
}