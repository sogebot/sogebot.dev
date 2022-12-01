#/bin/bash
DIR="/app/static/"
PATHS=$(find $DIR | grep \\\[ | grep -wv _next | grep -wv index.html)

echo $PATHS

for item in $PATHS
do
  PATH="${item/$DIR/}"
  URL="${PATH/\[*\]/([a-z0-9-]+)/?}"
  echo "location ~ ^$URL {"
  echo "  root $DIR;"
  echo "  try_files"
  echo "    \"$PATH/index.html\""
  echo "    proxy_pass;"
  echo "}"
done