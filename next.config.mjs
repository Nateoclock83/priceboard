/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputStandalone: true
  },
  compiler: {
    removeConsole: false // Keep console logs for debugging
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  }
}

export default nextConfig
