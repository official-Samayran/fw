// src/app/auction/[id]/page.tsx
import AuctionClient from "@/components/AuctionClient"; 

interface Props {
  params: {
    id: string | Promise<string>;
  };
}

// --- Main Page Component (Server Component) ---
export default async function LiveAuctionPage({ params }: Props) {
  // Await params to safely extract the resolved ID, fixing the console error
  const resolvedParams = await params; 
  const auctionId = resolvedParams.id as string;

  // Render the Client Component, passing the resolved ID as a safe string prop.
  return <AuctionClient auctionId={auctionId} />;
}