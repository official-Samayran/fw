// src/app/dashboard/auctions/[id]/bids/page.tsx
import { ArrowLeft, Hand } from "lucide-react";
import Link from "next/link";

interface Props {
  params: {
    id: string;
  };
}

export default function BidHistoryPage({ params }: Props) {
    const auctionId = params.id;

    return (
        <div className="max-w-4xl mx-auto py-10">
            <Link 
                href={`/dashboard/auctions/${auctionId}`} 
                className="flex items-center gap-2 text-lg font-bold mb-6 text-[#22163F] hover:text-[#463985] transition"
            >
                <ArrowLeft size={20} /> Back to Dashboard
            </Link>
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E8E3DB] text-center">
                <h1 className="text-3xl font-extrabold mb-4 flex items-center justify-center gap-3 text-[#22163F]">
                    <Hand size={30} className="text-red-500" /> 
                    Detailed Bid History: {auctionId}
                </h1>
                <p className="text-lg text-gray-600">
                    This page would display a full, timestamped list of all bids placed on the auction,
                    including bidder names and amounts.
                </p>
                <div className="mt-6 text-sm text-gray-500">
                    Feature under development.
                </div>
            </div>
        </div>
    );
}