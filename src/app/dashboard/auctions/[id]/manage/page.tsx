// src/app/dashboard/auctions/[id]/manage/page.tsx
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";

interface Props {
  params: {
    id: string;
  };
}

export default function ManageAuctionPage({ params }: Props) {
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
                    <Settings size={30} className="text-[#D9A441]" /> 
                    Manage Auction: {auctionId}
                </h1>
                <p className="text-lg text-gray-600">
                    This page would contain forms to edit the auction details, 
                    extend the deadline, or change the fulfillment status.
                </p>
                <div className="mt-6 text-sm text-gray-500">
                    Feature under development.
                </div>
            </div>
        </div>
    );
}