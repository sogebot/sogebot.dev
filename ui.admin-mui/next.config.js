/** @type {import('next').NextConfig} */
module.exports = {
  experimental: {
    runtime: 'nodejs'
  },
  reactStrictMode: false,
  trailingSlash:   true,
  images:          { unoptimized: true },
  swcMinify: true,
};
