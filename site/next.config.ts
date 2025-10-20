import type { NextConfig } from "next";

// For GitHub Pages project page deployment
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "/hebrew_participle";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  basePath: basePath || undefined,
};

export default nextConfig;
