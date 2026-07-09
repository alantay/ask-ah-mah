import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

// Gated behind ANALYZE=true (see the `analyze` script) so normal builds are
// untouched. Emits the client/server treemaps under `.next/analyze/`.
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isDev = process.env.NODE_ENV === "development";

// 'unsafe-inline' script/style is required by Next's inline bootstrap and
// injected styles (a nonce-based CSP needs middleware — not worth it yet).
// Dev additionally needs eval + websockets for Turbopack/HMR.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  // blob:/data: for next/image placeholders; the two photo CDNs match
  // images.remotePatterns below.
  "img-src 'self' blob: data: https://images.unsplash.com https://images.pexels.com",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // screen-wake-lock is deliberately left enabled — CookingMode holds one.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

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
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default bundleAnalyzer(nextConfig);
