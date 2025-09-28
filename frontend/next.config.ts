import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default {
  async rewrites() {
    return process.env.NODE_ENV === "development"
      ? [{ source: "/api/:path*", destination: "http://localhost:8000/:path*" }]
      : [];
  },
};
