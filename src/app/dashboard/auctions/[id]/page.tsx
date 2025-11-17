// src/app/dashboard/auctions/[id]/page.tsx
import { ArrowLeft, BarChart, Settings, Hand } from "lucide-react";
import Link from "next/link";

// Helper to format currency (copied from AuctionClient.tsx)
const formatINR = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Interface for fetching auction details
interface AuctionDetails {
    _id: string;
    title: string;
    bid: string; // The formatted bid string
    currentHighBid: number;
    bids: number;
    endDate: string;
    titleImage?: string | null;
}

interface Props {
  // We keep the Props interface definition for clarity
  params: {
    id: string;
  };
}

/**
 * Data Fetching Function to get single auction details
 */
async function getAuctionDetails(auctionId: string): Promise<AuctionDetails | null> {
    
    // Define the base URL, falling back to localhost if NEXTAUTH_URL is not set and we are in development.
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = process.env.NEXTAUTH_URL || (isDev ? 'http://localhost:3000' : null);
    
    if (!baseUrl) {
        console.error("CRITICAL: NEXTAUTH_URL is not defined.");
        return null;
    }
    
    const apiURL = `${baseUrl}/api/auctions/${auctionId}`;
    console.log(`Attempting fetch for auction ID: ${auctionId} at ${apiURL}`); // Log the actual ID being fetched

    const res = await fetch(apiURL, {
        cache: 'no-store',
    });

    if (!res.ok) {
        console.error(`API Fetch FAILED for auction ${auctionId}. Status: ${res.status} (${res.statusText})`);
        // We removed the error body logging to avoid unnecessary complexity, relying on the API status now.
        return null;
    }

    const data: any = await res.json();
    
    // Check if the auction object itself is empty/invalid
    if (!data || !data._id) {
        console.error("API returned OK status but no valid auction data.");
        return null;
    }

    return {
        _id: data._id,
        title: data.title,
        bid: data.bid,
        currentHighBid: data.currentHighBid,
        bids: data.bids,
        endDate: data.endDate,
        titleImage: data.titleImage || null,
    };
}

// Helper to calculate time left for the UI
function getTimeLeft(endDate: string): string {
    const now = new Date();
    const end = new Date(endDate);
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) return "Ended";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ${diffHours}h left`;
    if (diffHours > 0) return `${diffHours}h ${diffMinutes}m left`;
    return `${diffMinutes}m left`;
}


export default async function AuctionDashboardDetailPage({ params }: Props) {
    // FIX: Destructuring directly on the `params` object ensures the dynamic segment is correctly accessed.
    const { id: auctionId } = params; 
    
    const auction = await getAuctionDetails(auctionId);

    if (!auction) {
        return (
            <div className="max-w-4xl mx-auto py-10 text-center text-red-500">
                Error: Auction details not found or failed to load. Please ensure your MongoDB server is running and the Auction ID is valid.
            </div>
        );
    }
    
    const timeLeft = getTimeLeft(auction.endDate);
    const isLive = timeLeft !== "Ended";

    return (
        <div className="max-w-4xl mx-auto py-10">
            <Link 
                href="/dashboard/auctions" 
                className="flex items-center gap-2 text-lg font-bold mb-6 text-[#22163F] hover:text-[#463985] transition"
            >
                <ArrowLeft size={20} /> Back to Auction List
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E8E3DB]">
                
                {/* Auction Header: Image and Title */}
                <div className="flex items-start gap-6 pb-6 border-b mb-6">
                    <div className="h-28 w-28 flex-shrink-0 rounded-xl overflow-hidden shadow-md">
                        {auction.titleImage ? (
                            <img src={auction.titleImage} alt={auction.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Image</div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold flex items-center gap-3 text-[#22163F]">
                            {auction.title}
                        </h1>
                        <p className={`mt-2 inline-block px-3 py-1 text-sm font-bold rounded-full border ${isLive ? 'text-red-600 bg-red-100 border-red-200' : 'text-gray-600 bg-gray-100 border-gray-200'}`}>
                            {isLive ? 'LIVE' : 'ENDED'}
                        </p>
                    </div>
                </div>


                <h2 className="text-xl font-bold mb-4 flex items-center gap-3 text-[#22163F]">
                    <BarChart size={24} className="text-[#D9A441]" /> 
                    Live Metrics
                </h2>
                

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 border rounded-xl bg-gray-50">
                        <p className="text-3xl font-bold text-green-700">{auction.bid}</p>
                        <p className="text-sm text-gray-600">Current High Bid</p>
                    </div>
                    <div className="p-4 border rounded-xl bg-gray-50">
                        <p className="text-3xl font-bold text-red-500">{auction.bids}</p>
                        <p className="text-sm text-gray-600">Total Bids</p>
                    </div>
                    <div className="p-4 border rounded-xl bg-gray-50" suppressHydrationWarning>
                        <p className="text-3xl font-bold text-blue-500">{timeLeft}</p>
                        <p className="text-sm text-gray-600">Status</p>
                    </div>
                </div>

                <h2 className="text-xl font-bold mt-8 mb-4 text-[#22163F]">Admin Actions</h2>
                <div className="flex gap-4">
                    {/* Button 1: Manage Auction */}
                    <Link
                        href={`/dashboard/auctions/${auctionId}/manage`} 
                        className="flex-1 py-3 bg-[#2F235A] text-white rounded-xl font-semibold hover:bg-[#463985] transition flex items-center justify-center gap-2"
                    >
                        <Settings size={20} /> Manage Auction
                    </Link>
                    
                    {/* Button 2: View Bid History */}
                    <Link
                        href={`/dashboard/auctions/${auctionId}/bids`} 
                        className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                    >
                        <Hand size={20} /> View Bid History
                    </Link>
                </div>
            </div>
        </div>
    );
}