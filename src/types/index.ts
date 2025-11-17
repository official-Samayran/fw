// src/types/index.ts
export interface Celeb {
  id: string;
  name: string;
  desc: string;
  followers: number;
  profilePicture?: string | null; // <--- FIX: Added profilePicture field
}

export interface NgoPost {
  _id: string;
  ngoId: string;
  ngoName: string;
  title: string;
  content: string;
  mediaUrls: string[]; 
  createdAt: string;
  likesCount: number;
  commentsCount: number; 
  isLiked: boolean; 
  // --- NEW FIELD ---
  ngoProfilePicture: string | null;
  // -----------------
}