/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/vnscout',
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/vietmap-api/:path*',
        destination: 'https://maps.vietmap.vn/:path*',
      },
    ]
  },
}

export default nextConfig
