// src/components/ImageCarousel.tsx
"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  mediaUrls: string[];
}

export default function ImageCarousel({ mediaUrls }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!mediaUrls || mediaUrls.length === 0) {
    return null; 
  }
  
  const totalSlides = mediaUrls.length;

  const nextSlide = () => {
    // Moves forward, wraps to 0
    setActiveIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    // Moves backward, wraps to the last slide (totalSlides - 1)
    setActiveIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  return (
    <div className="relative w-full h-80 bg-gray-100 border-t border-b overflow-hidden">
      
      {/* Slides Container */}
      <div 
        className="flex w-full h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {mediaUrls.map((url, index) => (
          <div key={index} className="flex-shrink-0 w-full h-full">
            <img 
              src={url} 
              alt={`Post media ${index + 1}`} 
              className="w-full h-full object-cover" 
            />
          </div>
        ))}
      </div>

      {/* Controls */}
      {totalSlides > 1 && (
        <>
          <button
            onClick={prevSlide}
            // --- FIX: Use bg-white/40 (was bg-white) for a translucent look ---
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/40 text-[#22163F] rounded-full hover:bg-white/70 transition z-10"
            aria-label="Previous image"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={nextSlide}
            // --- FIX: Use bg-white/40 (was bg-white) for a translucent look ---
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/40 text-[#22163F] rounded-full hover:bg-white/70 transition z-10"
            aria-label="Next image"
          >
            <ChevronRight size={24} />
          </button>

          {/* Indicators/Dots (unchanged) */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2">
            {mediaUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300",
                  index === activeIndex ? "bg-white w-6" : "bg-gray-400"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}