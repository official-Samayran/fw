// src/app/auction/create/page.tsx
"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, DollarSign, Clock, Handshake, ImageIcon, CheckCircle, UploadCloud, Plus, X, Trash2, FileText } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { cn } from "@/utils/cn"; 

// Mock type definitions for form data
interface AuctionFormData {
  title: string;
  category: string;
  shortDescription: string;
  detailedDescription: string;
  startingPrice: string;
  bidIncrement: string;
  reservePrice: string;
  buyNowPrice: string;
  startDate: string;
  endDate: string;
  ngo: string;
  titleImage: string | null; // Base64 Data URL for the primary image
  secondaryImages: string[]; // Array of Base64 Data URLs for gallery
  proofOfAuth: string | null; 
  isConfirmed: boolean;
}

// Mock NGO List (could be fetched from an API in a real app)
const MOCK_NGOS = [
  "Old Heritage Trust",
  "Music For All",
  "Children Art Fund",
  "Healthcare Mission",
  "Education for All",
];

// Helper to convert File to Base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

// Reusable Input Component (Kept for completeness)
const FormInput: React.FC<any> = ({ id, label, required, as = 'input', children, ...rest }) => (
  <div>
    <label htmlFor={id} className="font-semibold text-sm mb-1 block text-[#22163F]">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {as === 'input' && (
      <input
        id={id}
        name={id}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] bg-white text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition"
        {...rest}
      />
    )}
    {as === 'textarea' && (
      <textarea
        id={id}
        name={id}
        required={required}
        rows={4}
        className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] bg-white text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition resize-none"
        {...rest}
      />
    )}
    {as === 'select' && (
      <select
        id={id}
        name={id}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-[#D5D0C7] bg-white text-sm shadow-sm focus:border-[#2F235A] focus:ring-1 focus:ring-[#2F235A] transition appearance-none cursor-pointer"
        {...rest}
      >
        {children}
      </select>
    )}
  </div>
);

// --- MODIFIED File/Image Upload Component for Previews (unchanged) ---
const FileUploadSection: React.FC<{ 
    label: string; 
    icon: React.ElementType;
    onFileSelect: (files: File[]) => void;
    onFileRemove: (dataUrl: string) => void;
    allowMultiple: boolean;
    currentPreviews: string[]; 
    fileTypes: string; 
    maxFiles?: number;
    required?: boolean;
}> = ({ label, icon: Icon, onFileSelect, onFileRemove, allowMultiple, currentPreviews, fileTypes, maxFiles, required = false }) => {
    const FileIcon = Icon;
    const inputId = `file-upload-${label.replace(/\s+/g, '-')}`;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            onFileSelect(files);
        }
        e.target.value = ''; 
    };

    const PreviewItem: React.FC<{ url: string, isImage: boolean }> = ({ url, isImage }) => (
        <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden group">
            {isImage ? (
                <img 
                    src={url} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                />
            ) : (
                <div className="w-full h-24 w-24 flex flex-col items-center justify-center bg-gray-50 text-gray-500 p-2">
                    <FileText size={24} />
                    <span className="text-xs mt-1 text-center truncate w-full">Document</span>
                </div>
            )}
            <button 
                type="button" 
                onClick={() => onFileRemove(url)}
                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition"
                aria-label="Remove file"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );

    const isImageUpload = fileTypes.includes('image');
    const canUpload = allowMultiple 
        ? (maxFiles ? currentPreviews.length < maxFiles : true) 
        : currentPreviews.length === 0;

    return (
        <div className="mb-4">
            <label className="font-semibold text-sm mb-2 block text-[#22163F]">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap gap-4 items-center">
                
                {/* Previews */}
                {currentPreviews.map((url, index) => (
                    <PreviewItem key={index} url={url} isImage={isImageUpload} />
                ))}

                {/* Upload Button */}
                {canUpload && (
                    <label
                        htmlFor={`file-upload-${label.replace(/\s+/g, '-')}`}
                        className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border-2 border-dashed transition cursor-pointer",
                            "border-[#2F235A] bg-[#E7E1F6] hover:bg-[#D6CCE8] text-[#22163F] h-24 w-24 text-xs font-semibold",
                            !canUpload && 'cursor-not-allowed opacity-50'
                        )}
                    >
                        <UploadCloud size={24} className="mb-1" />
                        {allowMultiple ? "Add More" : "Upload"}
                        <input
                            id={`file-upload-${label.replace(/\s+/g, '-')}`}
                            type="file"
                            className="sr-only"
                            accept={fileTypes}
                            multiple={allowMultiple}
                            onChange={handleFileChange}
                            disabled={!canUpload}
                        />
                    </label>
                )}
            </div>
            {maxFiles && currentPreviews.length > maxFiles && (
                 <p className="text-xs text-red-500 mt-1">Too many files selected. Maximum is {maxFiles}.</p>
            )}
             {required && currentPreviews.length === 0 && (
                <p className="text-xs text-red-500 mt-1">At least one file is required.</p>
            )}
        </div>
    );
};
// --- END MODIFIED File/Image Upload Component ---


export default function CreateAuctionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<AuctionFormData>({
    title: "",
    category: "Art",
    shortDescription: "",
    detailedDescription: "",
    startingPrice: "", 
    bidIncrement: "100", // <-- Added default
    reservePrice: "",
    buyNowPrice: "",
    startDate: new Date().toISOString().substring(0, 16), // <-- Added default to today's time
    endDate: "",
    ngo: MOCK_NGOS[0],
    titleImage: null, 
    secondaryImages: [], 
    proofOfAuth: null, 
    isConfirmed: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Helper to convert File to Base64 data URL
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // --- HANDLERS FOR PRIMARY IMAGE (unchanged) ---
  const handleTitleImageSelect = async (files: File[]) => {
    if (files.length === 0) return;
    try {
        const base64Url = await fileToBase64(files[0]);
        setFormData(prev => ({ ...prev, titleImage: base64Url }));
    } catch (e) {
        setError("Failed to process primary image file.");
    }
  };

  const handleTitleImageRemove = useCallback(() => {
    setFormData(prev => ({ ...prev, titleImage: null }));
  }, []);

  // --- HANDLERS FOR SECONDARY IMAGES (unchanged) ---
  const handleSecondaryImagesSelect = async (files: File[]) => {
    // Basic max file check for instant feedback
    if (formData.secondaryImages.length + files.length > 4) {
        setError("You can only upload a maximum of 4 secondary images.");
        return;
    }
    try {
        const base64Urls = await Promise.all(files.map(fileToBase64));
        setFormData(prev => ({ ...prev, secondaryImages: [...prev.secondaryImages, ...base64Urls].slice(0, 4) }));
    } catch (e) {
        setError("Failed to process image file(s).");
    }
  };

  const handleSecondaryImageRemove = useCallback((dataUrlToRemove: string) => {
    setFormData(prev => ({ ...prev, secondaryImages: prev.secondaryImages.filter(url => url !== dataUrlToRemove) }));
  }, []);

  // --- HANDLERS FOR AUTH PROOF (unchanged) ---
  const handleProofSelect = async (files: File[]) => {
    try {
        const base64Url = await fileToBase64(files[0]);
        setFormData(prev => ({ ...prev, proofOfAuth: base64Url }));
    } catch (e) {
        setError("Failed to process file.");
    }
  };

  const handleProofRemove = useCallback(() => {
    setFormData(prev => ({ ...prev, proofOfAuth: null }));
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 

    // --- FRONT-END VALIDATION (MODIFIED for new required fields) ---
    if (!formData.title || !formData.shortDescription || !formData.detailedDescription) {
        setError("Please provide a Title, Short Summary, and Detailed Description.");
        return;
    }
    if (!formData.startingPrice || !formData.endDate || !formData.bidIncrement || !formData.startDate) {
        setError("Starting Price, Bid Increment, Start Date, and End Date are mandatory.");
        return;
    }
    if (!formData.isConfirmed) {
        setError("You must confirm the terms and rights to auction this item.");
        return;
    }
    if (!formData.titleImage) {
        setError("You must upload a Title Image.");
        return;
    }
    
    // API Validation Check - Prices
    const numericStartingPrice = Number(formData.startingPrice);
    const numericBidIncrement = Number(formData.bidIncrement);
    const numericReservePrice = formData.reservePrice ? Number(formData.reservePrice) : null;
    const numericBuyNowPrice = formData.buyNowPrice ? Number(formData.buyNowPrice) : null;

    if (isNaN(numericStartingPrice) || numericStartingPrice <= 0) {
        setError("Starting Price must be a valid positive number.");
        return;
    }
    if (isNaN(numericBidIncrement) || numericBidIncrement <= 0) {
        setError("Bid Increment must be a valid positive number.");
        return;
    }
    if (numericReservePrice !== null && isNaN(numericReservePrice)) {
        setError("Reserve Price must be a valid number.");
        return;
    }
    if (numericBuyNowPrice !== null && isNaN(numericBuyNowPrice)) {
        setError("Buy Now Price must be a valid number.");
        return;
    }
    
    // API Validation Check - Dates
    const startDateObj = new Date(formData.startDate);
    const endDateObj = new Date(formData.endDate);
    if(endDateObj <= startDateObj) {
        setError("End Date must be after the Start Date.");
        return;
    }


    setLoading(true);

    // --- DATA TO SEND (MODIFIED to include all new fields) ---
    const dataToSend = {
      title: formData.title,
      startingPrice: numericStartingPrice,
      bidIncrement: numericBidIncrement,
      reservePrice: numericReservePrice,
      buyNowPrice: numericBuyNowPrice,
      category: formData.category,
      shortDescription: formData.shortDescription,
      detailedDescription: formData.detailedDescription,
      startDate: formData.startDate,
      endDate: formData.endDate,
      titleImage: formData.titleImage,
      // Note: Secondary images, proofOfAuth, and NGO selection are not yet handled by the API backend.
    };

    try {
      const res = await fetch("/api/auctions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = data.error || "Failed to create auction. Please try again.";
        
        // --- START ENHANCED ERROR MESSAGING ---
        if (res.status === 403) {
            errorMessage = "ACCESS DENIED: Only a logged-in 'Celebrity' account can create auctions.";
        } else if (res.status === 400 && data.error && data.error.includes("Missing required fields")) {
             errorMessage = "Missing required fields: Check Title, Prices, Start/End Dates, and Descriptions.";
        }
        // --- END ENHANCED ERROR MESSAGING ---
        
        throw new Error(errorMessage);
      }

      alert("Auction created successfully! Redirecting to auctions.");
      router.push("/auction");
    } catch (err: any) {
      // This is the message that will be displayed in the red box
      setError(err.message);
    }
    setLoading(false);
  };
  

  return (
    <div className="max-w-4xl mx-auto py-10">
      
      <Link href="/profile/me" className="flex items-center gap-2 text-lg font-bold mb-6 text-[#22163F] hover:text-[#463985] transition">
        <ArrowLeft size={20} /> Back to Profile
      </Link>

      <div className="card bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-[#E8E3DB]">
        <h1 className="text-3xl font-extrabold mb-2 text-[#22163F]">
          Launch a New Auction
        </h1>
        <p className="text-sm text-[#6B6B6B] mb-8">
            Fund your cause by auctioning an item or experience to your fans.
        </p>

        <form onSubmit={handleSubmit}>
            
            {/* E. IMAGES (unchanged) */}
            <section className="border-b border-gray-100 pb-8 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <ImageIcon size={24} className="text-[#D9A441]" />
                    <h2 className="text-xl font-bold text-[#22163F]">Product Images & Gallery</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* LEFT COLUMN: TITLE / PRIMARY IMAGE */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 h-full flex flex-col"> 
                        <h3 className="font-semibold text-base mb-2 text-[#22163F]">Title Image (Primary)</h3>
                        <p className="text-xs text-gray-500 mb-4 flex-shrink-0">This image will be used for listings and banners. Only one image allowed.</p>
                        <FileUploadSection 
                            label="Title Image" 
                            icon={ImageIcon}
                            onFileSelect={handleTitleImageSelect}
                            onFileRemove={handleTitleImageRemove}
                            allowMultiple={false}
                            currentPreviews={formData.titleImage ? [formData.titleImage] : []}
                            fileTypes="image/*"
                            required
                        />
                    </div>

                    {/* RIGHT COLUMN: SECONDARY / GALLERY IMAGES */}
                    <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 h-full flex flex-col">
                        <h3 className="font-semibold text-base mb-2 text-[#22163F]">Gallery Images (Secondary)</h3>
                        <p className="text-xs text-gray-500 mb-4 flex-shrink-0">Up to 4 additional photos for the auction gallery.</p>
                        <FileUploadSection 
                            label="Gallery Images" 
                            icon={ImageIcon}
                            onFileSelect={handleSecondaryImagesSelect}
                            onFileRemove={handleSecondaryImageRemove}
                            allowMultiple={true}
                            currentPreviews={formData.secondaryImages}
                            fileTypes="image/*"
                            maxFiles={4} 
                        />
                    </div>
                    
                </div>
            </section>

            {/* A. BASIC INFO (unchanged) */}
            <section className="border-b border-gray-100 pb-8 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Tag size={24} className="text-[#D9A441]" />
                    <h2 className="text-xl font-bold text-[#22163F]">Item Details</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormInput 
                        id="title" 
                        label="Auction Title" 
                        placeholder="e.g. Signed Guitar by AR Rahman" 
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                    <FormInput 
                        id="category" 
                        label="Category" 
                        as="select"
                        value={formData.category}
                        onChange={handleChange}
                        required
                    >
                        {["Art", "Experiences", "Merchandise", "Collectibles", "Charity / NGO Item"].map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </FormInput>
                </div>
                
                <FormInput 
                    id="shortDescription" 
                    label="Short Summary" 
                    placeholder="1-line summary for listing pages" 
                    value={formData.shortDescription}
                    onChange={handleChange}
                    required
                />
                <FormInput 
                    id="detailedDescription" 
                    label="Detailed Description" 
                    as="textarea"
                    placeholder="Describe item, story, authenticity, and the cause..."
                    value={formData.detailedDescription}
                    onChange={handleChange}
                    required
                />
            </section>


            {/* B. PRICING (updated labels/steps) */}
            <section className="border-b border-gray-100 pb-8 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <DollarSign size={24} className="text-[#D9A441]" />
                    <h2 className="text-xl font-bold text-[#22163F]">Pricing & Bidding</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <FormInput 
                        id="startingPrice" 
                        label="Starting Price (₹) *" 
                        type="number" 
                        placeholder="Min Bid to start (Required by API)"
                        value={formData.startingPrice}
                        onChange={handleChange}
                        required
                        step="100"
                    />
                    <FormInput 
                        id="bidIncrement" 
                        label="Bid Increment (₹) *" 
                        type="number" 
                        placeholder="e.g. 100 (Required by API)"
                        value={formData.bidIncrement}
                        onChange={handleChange}
                        required
                        step="10"
                    />
                    <FormInput 
                        id="reservePrice" 
                        label="Reserve Price (Optional, ₹)" 
                        type="number" 
                        placeholder="Leave blank if no reserve"
                        value={formData.reservePrice}
                        onChange={handleChange}
                        step="100"
                    />
                    <FormInput 
                        id="buyNowPrice" 
                        label="Buy Now Price (Optional, ₹)" 
                        type="number" 
                        placeholder="Optional"
                        value={formData.buyNowPrice}
                        onChange={handleChange}
                        step="100"
                    />
                </div>
            </section>
            
            {/* C. DATES (updated labels) */}
            <section className="border-b border-gray-100 pb-8 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Clock size={24} className="text-[#D9A441]" />
                    <h2 className="text-xl font-bold text-[#22163F]">Auction Timing</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormInput 
                        id="startDate" 
                        label="Start Date & Time *" 
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                    />
                    <FormInput 
                        id="endDate" 
                        label="End Date & Time *" 
                        type="datetime-local"
                        min={formData.startDate} // Basic validation
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                    />
                </div>
            </section>

            {/* D. NGO / CAUSE (unchanged) */}
            <section className="border-b border-gray-100 pb-8 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <Handshake size={24} className="text-[#D9A441]" />
                    <h2 className="text-xl font-bold text-[#22163F]">NGO / Cause</h2>
                </div>
                
                <FormInput 
                    id="ngo" 
                    label="Select NGO Partner" 
                    as="select"
                    value={formData.ngo}
                    onChange={handleChange}
                    required
                >
                    {MOCK_NGOS.map(ngo => (
                        <option key={ngo} value={ngo}>{ngo}</option>
                    ))}
                </FormInput>

                <p className="text-xs text-gray-500 mt-2 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <Plus size={12} className="inline-block mr-1 text-yellow-600" /> All listed NGOs are verified partners, ensuring maximum impact transparency.
                </p>
            </section>
            
            
            {/* F. VERIFICATION (unchanged) */}
            <section className="pb-8">
                <div className="flex items-center gap-3 mb-4">
                    <CheckCircle size={24} className="text-[#D9A441]" />
                    <h2 className="text-xl font-bold text-[#22163F]">Verification & Consent</h2>
                </div>
                
                <FileUploadSection 
                    label="Proof of Authenticity (Optional)" 
                    icon={FileText}
                    onFileSelect={handleProofSelect}
                    onFileRemove={handleProofRemove}
                    allowMultiple={false}
                    currentPreviews={formData.proofOfAuth ? [formData.proofOfAuth] : []}
                    fileTypes=".pdf,.doc,.docx" // Allow document types
                />

                <label className="flex items-start gap-3 mt-4 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.isConfirmed}
                    onChange={(e) => {
                        setFormData(prev => ({ ...prev, isConfirmed: e.target.checked }));
                        setError('');
                    }}
                    required
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-[#22163F] focus:ring-[#22163F]"
                  />  
                  <span className="text-sm font-medium text-[#22163F]">
                    I confirm that this item belongs to me or I have full legal rights to auction it, and all proceeds will be directed to the selected NGO partner.
                  </span>
                </label>
            </section>

            {error && <p className="text-red-600 text-sm text-center mb-4 p-3 rounded-lg border border-red-300 bg-red-50">{error}</p>}

            {/* G. SUBMIT */}
            <button 
                type="submit" 
                disabled={loading || !formData.isConfirmed || !formData.titleImage}
                className="w-full mt-2 py-3 rounded-xl flex items-center justify-center gap-2 bg-[#D9A441] hover:bg-[#C8943D] text-[#22163F] font-extrabold disabled:bg-gray-400 disabled:text-gray-600 transition"
            >
                <Plus size={20} /> {loading ? "Submitting Auction..." : "Launch Auction Now"}
            </button>
            <p className="text-xs text-center text-[#6B6B6B] mt-3">
                Auctions go live immediately after submission.
            </p>
        </form>

      </div>
    </div>
  );
}