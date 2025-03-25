const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@entity': path.resolve(__dirname, '../node_modules/@sogebot/backend/dest/database/entity'),
      '@backend': path.resolve(__dirname, '../node_modules/@sogebot/backend/dest'),
      '@d.ts': path.resolve(__dirname, '../node_modules/@sogebot/backend/d.ts')
    }
  }
};