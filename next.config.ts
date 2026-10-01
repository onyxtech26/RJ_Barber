import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // DuitNow QR screenshots from phones are often 1–3 MB; the upload action allows up to 4 MB.
      bodySizeLimit: "5mb",
    },
  },
};

export default nextConfig;
