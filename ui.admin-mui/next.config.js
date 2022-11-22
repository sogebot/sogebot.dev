/** @type {import('next').NextConfig} */
module.exports = {
  experimental:    { runtime: 'experimental-edge' },
  reactStrictMode: false,
  trailingSlash:   true,
  images:          { unoptimized: true },
};
