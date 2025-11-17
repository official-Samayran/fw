// src/app/dashboard/auctions/[id]/manage/ManageAuctionForm.tsx
"use client";

import React, { useState, FormEvent, useEffect } from "react"; // <--- Added useEffect
import { Settings, FileText, Clock, Send } from "lucide-react";

interface AuctionDetails {
  _id: string;
  title: string;
  description: string;
  endDate: string;
  currentHighBid: number;
  bids: number;
  titleImage?: string | null;
}

// Helper to format ISO date string to YYYY-MM-DDTHH:MM format for <input type="datetime-local">
const toDatetimeLocal = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  // date.toISOString().substring(0, 16) gets 'YYYY-MM-DDTHH:MM'
  return date.toISOString().substring(0, 16);
};


const ManageAuctionForm: React.FC<{ initialData: AuctionDetails }> = ({ initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData.title,
    description: initialData.description,
    // --- FIX: Use the helper to correctly format the ISO string for input ---
    endDate: toDatetimeLocal(initialData.endDate),
    // -----------------------------------------------------------------------
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // If initialData changes (e.g., component re-rendered with new data, which is unlikely but safe), update form state
  useEffect(() => {
    setFormData({
      title: initialData.title,
      description: initialData.description,
      endDate: toDatetimeLocal(initialData.endDate),
    });
  }, [initialData]);
  
  const isLive = new Date(formData.endDate) > new Date(); // Use formData's end date

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const updates = {
      title: formData.title,
      description: formData.description,
      // Convert the local datetime string back to an ISO string for the API
      endDate: new Date(formData.endDate).toISOString(), 
    };

    try {
      const res = await fetch(`/api/auctions/${initialData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to update auction details.");

      setMessageType("success");
      setMessage("Auction successfully updated!");
    } catch (err: any) {
      setMessageType("error");
      setMessage(err?.message || "An unexpected error occurred during update.");
    } finally {
      setLoading(false);
    }
  };

  const messageClass =
    messageType === "success"
      ? "bg-green-100 border-green-300 text-green-800"
      : "bg-red-100 border-red-300 text-red-800";

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#E8E3DB]">
      <h1 className="text-3xl font-extrabold mb-4 flex items-center gap-3 text-[#22163F]">
        <Settings size={30} className="text-[#D9A441]" />
        Manage Auction: {initialData.title}
      </h1>

      <div className="flex items-center gap-6 mb-8 p-4 border border-[#E8E3DB] rounded-xl bg-gray-50">
        <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
          {initialData.titleImage ? (
            <img src={initialData.titleImage} alt={initialData.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">No Image</div>
          )}
        </div>
        <div>
          <p className="text-xl font-bold text-[#22163F]">Current High Bid: ₹{initialData.currentHighBid.toLocaleString("en-IN")}</p>
          <p className="text-sm text-gray-600">{initialData.bids} total bids have been placed.</p>
          {initialData.bids > 0 && (
            <p className="text-xs text-red-500 font-semibold mt-1">Note: Bid details cannot be changed once bidding has started.</p>
          )}
        </div>
      </div>

      {message && <div className={`p-4 mb-6 rounded-xl border font-semibold text-sm ${messageClass}`}>{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h2 className="text-xl font-bold flex items-center gap-2 pt-4 border-t">
          <FileText size={20} className="text-[#2F235A]" /> Item Details
        </h2>

        <div>
          <label htmlFor="title" className="font-semibold text-sm mb-1 block text-[#22163F]">Auction Title</label>
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="font-semibold text-sm mb-1 block text-[#22163F]">Detailed Description</label>
          <textarea
            id="description"
            name="description"
            rows={6}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition resize-none"
            required
          />
        </div>

        <h2 className="text-xl font-bold flex items-center gap-2 pt-4 border-t">
          <Clock size={20} className="text-[#2F235A]" /> Auction Timing
        </h2>

        <div className="md:grid md:grid-cols-2 md:gap-4">
          <div>
            <label htmlFor="endDate" className="font-semibold text-sm mb-1 block text-[#22163F]">End Date & Time</label>
            <input
              id="endDate"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition"
              required
            />
          </div>

          <div className="mt-4 md:mt-0">
            <p className={`text-sm font-semibold p-3 rounded-xl border ${isLive ? "bg-red-50 border-red-200 text-red-600" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
              {isLive ? `Auction is LIVE. Extending the end date will allow more bidding.` : `Auction is ENDED. Changing the end date will reopen bidding.`}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-3 rounded-xl flex items-center justify-center gap-2 bg-[#D9A441] hover:bg-[#C8943D] text-[#22163F] font-extrabold disabled:bg-gray-400 disabled:text-gray-600 transition"
        >
          <Send size={20} /> {loading ? "Saving Changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ManageAuctionForm;