import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // DuitNow QR screenshots from phones are often 1–3 MB; the upload action allows up to 4 MB.
      bodySizeLimit: "5mb",
    },
  },
  // Online demo: ship the pre-built demo database with every server function (see src/server/db/client.ts).
  outputFileTracingIncludes: {
    "/**": ["./demo/rj-pos-demo.db"],
  },
};

export default nextConfig;
