import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cnts/api", "@cnts/monitoring", "@cnts/rbac"],
  output: "standalone",
  poweredByHeader: false,
  basePath: "/admin",
};

export default nextConfig;
