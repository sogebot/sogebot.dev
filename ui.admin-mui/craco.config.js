const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.symlinks = false; // treat workspace packages as local
      return webpackConfig;
    },
    alias: {
      '@entity': '@sogebot/backend/dest/database/entity',
      '@backend': '@sogebot/backend/dest',
      '@d.ts': '@sogebot/backend/d.ts',
    }
  }
};