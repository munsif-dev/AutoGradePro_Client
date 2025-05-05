/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        // Add your production backend domain here
        // http://54.90.145.153/api/lecturer/register/
        protocol: "http", // or http if your backend isn't using https
        hostname: process.env.HOST_ADDRESS,
        pathname: "/media/**",
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
  
  distDir: ".next",
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/api/:path*', // Browser uses localhost
      },
    ];
  },
};
export default nextConfig;
