/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  basePath: '/websitetest',
  images: {
    unoptimized: true,
    domains: ['images.unsplash.com', 'localhost'],
  },
}

module.exports = nextConfig