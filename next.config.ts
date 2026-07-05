import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  serverExternalPackages: ["@floating-ui/react", "@floating-ui/react-dom", "@floating-ui/core", "@floating-ui/dom"],
  experimental: {
    serverMinification: false,
  },
  // @ts-ignore
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
