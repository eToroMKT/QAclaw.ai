import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      { source: "/about", destination: "/about.html" },
      { source: "/marketing", destination: "/marketing.html" },
    ];
  },
};

export default nextConfig;
