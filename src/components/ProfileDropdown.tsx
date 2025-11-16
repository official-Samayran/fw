"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, User, ChevronDown } from "lucide-react";

interface Props {
  userName: string;
  userRole?: string;
  profilePictureUrl: string | null; // <-- ADDED: new prop
}

export default function ProfileDropdown({ userName, userRole, profilePictureUrl }: Props) { // <-- CHANGED: accept new prop
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

  const menuItems = [
    { label: "My Profile", href: "/profile/me", icon: User },
    // You can add more links here later, like settings or dashboard
  ];

  const Avatar = () => { // <-- NEW Avatar Component
    if (profilePictureUrl) {
        return (
            <img 
                src={profilePictureUrl} 
                alt={`${userName}'s profile`} 
                className="h-8 w-8 rounded-full object-cover flex-shrink-0" 
            />
        );
    }
    // Fallback to initials
    return (
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#F4C15D] to-[#D9A441] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {userName.charAt(0).toUpperCase()}
        </div>
    );
  };


  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1 transition bg-white border border-[#E6E3DD] hover:border-[#2F235A]"
        aria-expanded={isOpen}
        aria-label="User Profile Menu"
      >
        <Avatar /> {/* <-- USE Avatar COMPONENT */}
        <ChevronDown size={14} className={`text-[#2F235A] transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl bg-white p-2 shadow-xl border border-gray-100 animate-slideUp">
          
          {/* User Info */}
          <div className="px-3 py-2 border-b mb-2">
            <p className="font-semibold text-sm text-[#22163F] truncate">{userName}</p>
            {userRole && <p className="text-xs text-gray-500 capitalize">{userRole}</p>}
          </div>

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