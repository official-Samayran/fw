// src/app/dashboard/auctions/[id]/manage/page.tsx
// NOTE: This file is a Server Component (no "use client" here)

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ManageAuctionForm from "./ManageAuctionForm";

interface AuctionDetails {
  _id: string;
  title: string;
  description: string;
  endDate: string;
  currentHighBid: number;
  bids: number;
  titleImage?: string | null;
}

interface Props {
  params: {
    id: string | Promise<string>;
  };
}

async function getAuctionDetails(auctionId: string): Promise<AuctionDetails | null> {
  const isDev = process.env.NODE_ENV === "development";
  const baseUrl = process.env.NEXTAUTH_URL || (isDev ? "http://localhost:3000" : null);

  if (!baseUrl) {
    console.error("CRITICAL: NEXTAUTH_URL is not defined.");
    return null;
  }

  const apiURL = `${baseUrl}/api/auctions/${auctionId}`;

  const res = await fetch(apiURL, { cache: "no-store" });

  if (!res.ok) {
    console.error(`API Fetch FAILED for auction ${auctionId}. Status: ${res.status}`);
    return null;
  }

  const data: any = await res.json();

  if (!data || !data._id) {
    return null;
  }

  return {
    _id: data._id,
    title: data.title,
    description: data.description,
    endDate: data.endDate,
    currentHighBid: data.currentHighBid || 0,
    bids: data.bids || 0,
    titleImage: data.titleImage || null,
  };
}

export default async function ManageAuctionPage({ params }: Props) {
  const resolvedParams = await params;
  const auctionId = resolvedParams.id as string;

  if (!auctionId || auctionId === "undefined") {
    return notFound();
  }

  const initialData = await getAuctionDetails(auctionId);

  if (!initialData) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <Link
        href={`/dashboard/auctions/${auctionId}`}
        className="flex items-center gap-2 text-lg font-bold mb-6 text-[#22163F] hover:text-[#463985] transition"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </Link>

      <ManageAuctionForm initialData={initialData} />
    </div>
  );
}
