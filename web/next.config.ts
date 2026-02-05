import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cnts/api", "@cnts/monitoring", "@cnts/rbac"],
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
