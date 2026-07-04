import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

// Gated behind ANALYZE=true (see the `analyze` script) so normal builds are
// untouched. Emits the client/server treemaps under `.next/analyze/`.
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
    ],
  },
};

export default bundleAnalyzer(nextConfig);
