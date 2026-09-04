/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development'

const nextConfig = {
  // basePath chỉ dùng trên production (deploy với nginx /vnscout prefix)
  // Khi dev local bỏ basePath để truy cập http://localhost:3000 trực tiếp
  ...(isDev ? {} : { basePath: '/vnscout' }),
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
      // Proxy API calls server-side → tránh CORS khi dev
      ...(isDev ? [{
        source: '/api/:path*',
        destination: 'http://localhost:8081/api/:path*',
      }] : []),
      {
        source: '/vietmap-api/:path*',
        destination: 'https://maps.vietmap.vn/:path*',
      },
    ]
  },
}

export default nextConfig
