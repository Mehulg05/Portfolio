import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next 16 only honours qualities listed here; the portrait is served at 90.
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
