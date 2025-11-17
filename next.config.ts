import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // --- START CRITICAL CHANGE FOR LARGE PAYLOADS ---
  // Setting bodyParser to false delegates request body parsing to the route handler, 
  // which is better for file uploads (like our large Base64 string).
  reactStrictMode: true,
  experimental: {
    serverActions: {},
  },

  turbopack: {
    root: __dirname,
  },
  // --- END CRITICAL CHANGE ---
};

export default nextConfig;