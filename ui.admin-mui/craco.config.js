const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.symlinks = false; // treat workspace packages as local
      return webpackConfig;
    },
    alias: {
      '@entity': path.resolve(__dirname, '../node_modules/@sogebot/backend/dest/database/entity'),
      '@backend': path.resolve(__dirname, '../node_modules/@sogebot/backend/dest'),
      '@d.ts': path.resolve(__dirname, '../node_modules/@sogebot/backend/d.ts')
    }
  }
};