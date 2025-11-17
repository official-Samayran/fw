// src/app/dashboard/auctions/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutDashboard } from "lucide-react";

// Assuming CelebrityAuctionsList and Auction interface are available via import or copy
// For simplicity, we will copy the necessary components/interfaces here.

// Re-defining interfaces/components from src/app/profile/me/page.tsx
interface Auction {
    _id: string;
    title: string;
    bid: string;
    bids: number;
    endDate: string;
    titleImage?: string | null;
}

// Re-defining CelebrityAuctionsList to be self-contained or imported.
// I will fetch the content of CelebrityAuctionsList to use it directly here.
// Since the instruction is to avoid half-code, I will include the logic directly.

// --- Start of Reused Component Logic (CelebrityAuctionsList) ---
import { useState, useCallback } from "react";
import { TrendingUp, DollarSign } from "lucide-react"; 

function CelebrityAuctionsList({ userId }: { userId: string }) {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function fetchAuctions() {
            try {
                const res = await fetch(`/api/auctions?createdBy=${userId}`);
                if (!res.ok) {
                    throw new Error("Failed to fetch auctions");
                }
                const data: Auction[] = await res.json();
                setAuctions(data);
            } catch (e: any) {
                console.error("Fetch auctions error:", e);
                setError(e.message || "Failed to load auctions.");
            } finally {
                setLoading(false);
            }
        }
        fetchAuctions();
    }, [userId]);

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Loading auctions...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-500">Error loading auctions: {error}</div>;
    }
    
    const getStatus = (endDate: string) => {
        const now = new Date();
        const end = new Date(endDate);
        if (end > now) return { label: "LIVE", color: "text-red-600 bg-red-100 border-red-200" };
        return { label: "ENDED", color: "text-gray-600 bg-gray-100 border-gray-200" };
    };

    return (
        <div className="space-y-4">
            {auctions.length === 0 ? (
                <p className="p-4 text-gray-600 border rounded-xl bg-gray-50">You have not created any auctions yet.</p>
            ) : (
                auctions.map((auction) => {
                    const status = getStatus(auction.endDate);
                    return (
                        <Link 
                            // --- CRITICAL CHANGE: Link to the specific auction dashboard ---
                            href={`/dashboard/auctions/${auction._id}`} 
                            key={auction._id} 
                            className="flex items-center gap-4 rounded-xl p-3 bg-white border shadow-sm hover:shadow-md transition"
                        >
                            {/* Auction Image */}
                            <div className="h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden">
                                {auction.titleImage ? (
                                    <img src={auction.titleImage} alt={auction.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                                        Item
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex-grow">
                                <h3 className="font-semibold text-base truncate">{auction.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    <TrendingUp size={12} className="inline mr-1 text-blue-500" /> {auction.bids} Bids 
                                    <DollarSign size={12} className="inline ml-3 mr-1 text-green-500" /> Current Bid: {auction.bid}
                                </p>
                            </div>

                            <div className="text-right flex-shrink-0">
                                <span 
                                    className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${status.color}`}
                                >
                                    {status.label}
                                </span>
                                <p className="text-xs text-gray-500 mt-1" suppressHydrationWarning>
                                    Ends: {new Date(auction.endDate).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                    );
                })
            )}
        </div>
    );
}
// --- End of Reused Component Logic ---


export default function CelebrityAuctionsDashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter(); 

    const user = session?.user as { id: string; role: string } | undefined;

    useEffect(() => {
        if (status === "loading") return;
        
        // 1. Check Authentication
        if (status === "unauthenticated") {
            router.push("/auth");
            return;
        }

        // 2. Check Authorization (Role restriction)
        if (user && user.role !== 'celebrity') {
            alert("Access denied. Only celebrities can view this dashboard.");
            router.push("/");
        }
    }, [status, user, router]);

    if (status === "loading" || !user || user.role !== 'celebrity') {
        return <div className="text-center py-20">Loading dashboard...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-10">
            <h1 className="text-3xl font-extrabold mb-6 flex items-center gap-3 text-[#22163F]">
                <LayoutDashboard size={30} className="text-[#D9A441]" /> 
                Your Auction Dashboard
            </h1>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E8E3DB]">
                <CelebrityAuctionsList userId={user.id} />
            </div>
            
            <div className="mt-8 text-center">
                <Link href="/auction/create" className="text-sm font-semibold text-[#2F235A] hover:underline">
                    + Create a new auction
                </Link>
            </div>
        </div>
    );
}