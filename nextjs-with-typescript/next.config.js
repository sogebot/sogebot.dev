/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  basePath: '/public',
  images: {
    loader: 'akamai',
    path: '',
    domains: ['img.youtube.com'],
  },
};
