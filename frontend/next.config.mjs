/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://212.164.218.218:45106/:path*' },
    ];
  },
}

export default nextConfig
