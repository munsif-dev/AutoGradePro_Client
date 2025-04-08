/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["127.0.0.1", "localhost"], // Allow images from localhost and 127.0.0.1
  },
  typescript: {
    // ⚠️ This will completely ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Also ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
};
export default nextConfig;
