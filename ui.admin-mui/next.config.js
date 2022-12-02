/** @type {import('next').NextConfig} */
module.exports = {
  basePath: process.env.COMMIT
    ? '/' + process.env.COMMIT
    : '',
  reactStrictMode: false,
  trailingSlash:   true,
  images:          { unoptimized: true },
  swcMinify:       true,
};
