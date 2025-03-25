#/bin/bash
COMMITS=$(npx --yes ts-node -T -O '{"module": "esnext", "isolatedModules": false }' -e 'const { versions } = require("./src/compatibilityList"); Object.values(versions).map(o => console.log(o))')

for commit in $COMMITS
do
  docker run -v /${commit}:/mnt --entrypoint /bin/bash sogebot/dashboard:${commit} -c "cp -r /app/static/${commit}/* /mnt"
  zip -r ${commit}.zip /${commit}
  echo "Build ${commit} downloaded and zipped."
done