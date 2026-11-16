import type { NextConfig } from "next";

/*
  Static security headers for every response on both hosts. The Content-Security-Policy is
  set in proxy.ts instead, because the admin panel's carries a per-request nonce.
*/
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // The site uses none of these; denying them also denies them to anything it might embed.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  images: {
    // Next 16 only honours qualities listed here; the portrait is served at 90.
    qualities: [75, 90],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Browsers ask for /favicon.ico before they read the page's <link rel="icon">.
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
};

export default nextConfig;
