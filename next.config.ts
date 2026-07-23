import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lklmqywpyvkxjghgoine.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;