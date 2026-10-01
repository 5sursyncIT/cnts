import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@cnts/api", "@cnts/monitoring", "@cnts/rbac"],
  output: "standalone",
  poweredByHeader: false,
  images: {
    // Resolve local images directly under the basePath; see ./image-loader.ts
    // for why we bypass the built-in optimizer.
    loader: "custom",
    loaderFile: "./image-loader.ts",
  },
};

export default nextConfig;
