// src/components/ProfileDropdown.tsx (MODIFIED)
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, User, ChevronDown, LayoutDashboard } from "lucide-react"; // <--- ADDED LayoutDashboard icon
import UserAvatar from "./UserAvatar"; 

interface Props {
  userName: string;
  userRole?: string;
}

// NEW helper component for the dropdown header, showing avatar + name/role side-by-side
const DropdownHeader = ({ userName, userRole }: Props) => (
  <div className="flex items-center gap-3 px-3 py-2 border-b mb-2">
    {/* Use UserAvatar for the image. It handles fetching. */}
    <UserAvatar size="small" /> 
    <div>
        <p className="font-semibold text-sm text-[#22163F] truncate">{userName}</p>
        {userRole && <p className="text-xs text-gray-500 capitalize">{userRole}</p>}
    </div>
  </div>
);


export default function ProfileDropdown({ userName, userRole }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown if the user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const handleSignOut = () => {
    setIsOpen(false);
    signOut();
  };

  // --- MODIFIED: Added Dashboard link conditionally ---
  const menuItems = [
    { label: "My Profile", href: "/profile/me", icon: User },
    ...(userRole === 'celebrity' ? [{ label: "My Dashboard", href: "/dashboard/auctions", icon: LayoutDashboard }] : [])
  ];
  // --- END MODIFIED ---


  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button (Closed State: ONLY PIC) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        // MODIFIED: Removed 'gap-2' and tightened padding to frame just the avatar
        className="flex items-center p-0.5 rounded-full transition bg-white border border-[#E6E3DD] hover:border-[#2F235A]"
        aria-expanded={isOpen}
        aria-label="User Profile Menu"
      >
        <UserAvatar size="small" /> 
        {/* Removed ChevronDown from here, as requested */}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl bg-white p-2 shadow-xl border border-gray-100 animate-slideUp">
          
          {/* User Info with Avatar/Name Side-by-Side (NEW HEADER) */}
          <DropdownHeader userName={userName} userRole={userRole} />

          {/* Navigation Links */}
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 p-3 text-sm text-[#1E1635] rounded-lg hover:bg-[#F4F2EE] transition"
            >
              <item.icon size={18} className="text-[#2F235A]" />
              {item.label}
            </Link>
          ))}
          
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 text-sm text-red-600 rounded-lg hover:bg-red-50 transition mt-1"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}