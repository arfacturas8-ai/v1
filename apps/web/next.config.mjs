/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cryb/database", "@cryb/auth", "@cryb/web3", "@cryb/shared"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;