import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // MVP: product/ID photos are submitted as plain URLs (see README) so
    // any https host is allowed. Tighten this to your actual storage
    // provider's domain (Vercel Blob / Cloudinary) once upload is wired in.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
