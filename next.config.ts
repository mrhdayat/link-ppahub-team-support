import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

// script-src needs 'unsafe-inline': Next 16 puts the RSC payload into every page as inline scripts
// (self.__next_f.push(...)) whose content changes with the site data, so no build-time hash can cover them.
// A per-request nonce would, but Next only applies it while rendering dynamically; it is incompatible with
// the static/PPR pages cacheComponents gives us (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
// So: no hash or nonce here (either would make browsers ignore 'unsafe-inline'), no third-party script origins.
// Dev only: React's debug eval and Turbopack's HMR socket.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  `connect-src 'self' https://api.open-meteo.com https://api.bmkg.go.id${dev ? " ws: wss:" : ""}`,
  "font-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=()" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
