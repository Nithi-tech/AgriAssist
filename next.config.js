/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  typescript: {
    // Ignore TypeScript errors during build (temporary)
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
