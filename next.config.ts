import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
  },
  images: {
    remotePatterns: [
      // Future: Supabase Storage public buckets for audio/image cache
      // { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};

export default nextConfig;
