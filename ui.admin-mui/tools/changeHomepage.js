const fs = require('fs');

const pkg = require('../package.json');

fs.writeFileSync('./package.json', JSON.stringify({ ...pkg, homepage: process.argv[2] }, null, 2));