/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // This will allow Next.js to work with our current Node.js version
    ignoreDuringBuilds: {
      nodejs: true
    }
  }
};

module.exports = nextConfig; 