// src/app/auth/page.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, User, HeartHandshake, UploadCloud, Eye, EyeOff, LogIn } from "lucide-react";

// --- PasswordInput Component ---
function PasswordInput({ value, onChange }: { 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="relative w-full">
      <input
        name="password"
        type={showPassword ? "text" : "password"}
        placeholder="Password"
        onChange={onChange}
        value={value}
        className="w-full px-4 py-2 rounded-md border"
        required
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

// --- ImageUploader Component ---
function ImageUploader({ imagePreview, onChange }: {
  imagePreview: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <label
        htmlFor="profilePhoto"
        className="relative flex flex-col items-center justify-center w-32 h-32 rounded-full border-2 border-dashed border-gray-300 bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
      >
        {imagePreview ? (
          <img
            src={imagePreview}
            alt="Profile Preview"
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-gray-400">
            <UploadCloud size={32} />
            <span className="mt-2 text-sm font-semibold">Upload Photo</span>
            <span className="text-xs">PNG, JPG, Max size 100kb (Demo)</span>
          </div>
        )}
        <input
          id="profilePhoto"
          name="profilePhoto"
          type="file"
          className="sr-only"
          accept="image/png, image/jpeg"
          onChange={onChange}
        />
      </label>
    </div>
  );
}

// --- LoginForm Component ---
function LoginForm() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 
    setLoading(true);

    const result = await signIn("credentials", {
      ...formData,
      redirect: false, 
    });

    setLoading(false);
    if (result?.error) {
      setError("Invalid email or password."); 
    } else {
      router.push("/"); // On success, go to homepage
      router.refresh(); // Refresh session data
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fadeIn">
      <input
        name="email"
        type="email"
        placeholder="Email Address"
        className="px-4 py-2 rounded-md border"
        onChange={handleChange}
        value={formData.email || ''}
        required
      />
      <PasswordInput
        value={formData.password || ''}
        onChange={handleChange}
      />
      {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-[#2F235A] text-white py-3 font-semibold hover:bg-[#463985] transition flex items-center justify-center gap-2 disabled:bg-gray-400"
      >
        <LogIn size={18} /> {loading ? "Logging in..." : "Log In"}
      </button>
    </form>
  );
}

// --- SignupForm Component ---
function SignupForm() {
  const [role, setRole] = useState<"celebrity" | "bidder" | "ngo" | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImagePreview(base64);
        setFormData((prev: any) => ({ ...prev, profilePicture: base64 })); // <-- ADDED: Save image data to formData
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
      setFormData((prev: any) => ({ ...prev, profilePicture: null })); // <-- ADDED: Clear image data
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Please select a role.");
      return;
    }
    setError("");
    setLoading(true);

    const completeFormData = { ...formData, role };
    // The image data is already in formData as 'profilePicture' if uploaded

    if (role === 'bidder' || role === 'celebrity') {
      completeFormData.fullName = formData.fullName;
    } else if (role === 'ngo') {
      completeFormData.fullName = formData.orgName;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completeFormData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register.");

      const signInResponse = await signIn("credentials", {
        email: completeFormData.email,
        password: completeFormData.password,
        redirect: false,
      });
      if (signInResponse?.error) throw new Error("Login failed after signup.");

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const roles = [
    { key: "bidder", label: "Bidder", icon: <User /> },
    { key: "celebrity", label: "Celebrity", icon: <Star /> },
    { key: "ngo", label: "NGO", icon: <HeartHandshake /> },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 animate-fadeIn">
      <div>
        <label className="font-semibold text-lg text-[#1E1635]">
          Who are you?
        </label>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {roles.map(({ key, label, icon }) => (
            <button
              type="button"
              key={key}
              onClick={() => setRole(key as any)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition ${
                role === key
                  ? "border-[#2F235A] bg-[#F4F2EE]"
                  : "border-gray-200 bg-white hover:border-gray-400"
              }`}
            >
              <div className={role === key ? "text-[#2F235A]" : "text-gray-500"}>
                {icon}
              </div>
              <span className="mt-2 text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {role && (
        <>
          <ImageUploader 
            imagePreview={imagePreview} 
            onChange={handleImageChange} 
          />
          {role === "bidder" && (
            <input name="fullName" placeholder="Full Name" onChange={handleChange} className="px-4 py-2 rounded-md border" required />
          )}
          {role === "celebrity" && (
            <>
              <input name="fullName" placeholder="Full Name / Stage Name" onChange={handleChange} className="px-4 py-2 rounded-md border" required />
              <input name="instagram" placeholder="Instagram Profile URL (e.g., @name)" onChange={handleChange} className="px-4 py-2 rounded-md border" />
            </>
          )}
          {role === "ngo" && (
            <>
              <input name="orgName" placeholder="Organization Name" onChange={handleChange} className="px-4 py-2 rounded-md border" required />
              <input name="regNumber" placeholder="Registration Number" onChange={handleChange} className="px-4 py-2 rounded-md border" />
            </>
          )}
          <input name="email" type="email" placeholder="Email" onChange={handleChange} className="px-4 py-2 rounded-md border" required />
          <PasswordInput 
            value={formData.password || ''}
            onChange={handleChange}
          />
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#2F235A] text-white py-3 font-semibold hover:bg-[#463985] disabled:bg-gray-400"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </>
      )}
    </form>
  );
}

// --- Main AuthPage Component ---
export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const searchParams = useSearchParams();

  // Check URL params to set the active tab
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup') {
      setTab('signup');
    } else {
      setTab('login');
    }
  }, [searchParams]);

  const activeTabClass = "border-b-2 border-[#2F235A] text-[#2F235A]";
  const inactiveTabClass = "text-gray-400 hover:text-gray-700";

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-[#F6F3EC] px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        
        {/* --- LEFT (Branding) --- */}
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-[#2F235A] to-[#463985] text-white">
          <h2 className="text-4xl font-extrabold mb-4">
            {tab === 'login' ? 'Welcome Back!' : 'Join Famwish'}
          </h2>
          <p className="text-lg opacity-90">
            Make wishes come true. <br />
            One bid. One act. One impact.
          </p>
          <div className="mt-10 opacity-60">
            <Link href="/" className="font-extrabold text-2xl tracking-tight">
              famwish
            </Link>
          </div>
        </div>

        {/* --- RIGHT (Form) --- */}
        <div className="p-8 md:p-12">
          {/* --- TAB SWITCHER --- */}
          <div className="flex gap-8 mb-6">
            <button
              onClick={() => setTab('login')}
              className={`text-xl font-bold pb-2 ${tab === 'login' ? activeTabClass : inactiveTabClass}`}
            >
              Log In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`text-xl font-bold pb-2 ${tab === 'signup' ? activeTabClass : inactiveTabClass}`}
            >
              Sign Up
            </button>
          </div>
          
          {/* --- DYNAMIC FORM --- */}
          {tab === 'login' ? <LoginForm /> : <SignupForm />}
          
        </div>
      </div>
    </div>
  );
}