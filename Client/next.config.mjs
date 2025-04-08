/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/media/**',
      },
      {
        // Add your production backend domain here
        protocol: 'https', // or http if your backend isn't using https
        hostname: 'your-backend-domain.com',
        pathname: '/media/**',
      },
    ],
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
