// src/components/CelebrityStrip.tsx
"use client";

import { Celeb } from "@/types";
import { cn } from "@/utils/cn"; // we'll add this utility shortly

interface Props {
  celebs: Celeb[];
  selected: Celeb;
  onSelect: (celeb: Celeb) => void;
}

export default function CelebrityStrip({ celebs, selected, onSelect }: Props) {
  return (
    <div className="flex gap-3 overflow-x-auto p-4 rounded-xl bg-white/50 shadow-inner">
      {celebs.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c)}
          className={cn(
            "min-w-[120px] cursor-pointer rounded-xl border p-3 flex flex-col items-center gap-2 transition",
            selected.id === c.id
              ? "border-[#22163F] shadow-lg"
              : "border-gray-200 hover:shadow-md hover:-translate-y-1"
          )}
        >
          {/* --- MODIFIED: Use profilePicture --- */}
          <div className="h-16 w-16 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-gray-200 to-gray-300">
            {c.profilePicture ? (
              <img src={c.profilePicture} alt={c.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-gray-500">{c.name.charAt(0)}</span>
            )}
          </div>
          {/* ------------------------------------ */}
          <div className="font-semibold text-sm text-[#22163F]">{c.name}</div>
          <div className="text-xs text-gray-500">
            {c.followers.toLocaleString()} followers
          </div>
        </div>
      ))}
    </div>
  );
}