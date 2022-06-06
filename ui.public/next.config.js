/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  basePath: '/public',
  images: {
    loader: 'custom',
    domains: ['img.youtube.com'],
  },
};
