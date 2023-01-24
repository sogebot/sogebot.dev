#/bin/bash
DIR="/app/static/"

# NEXT FILES
# PATHS=$(find $DIR | grep \\\[ | grep -wv _next | grep -wv index.html)
# for item in $PATHS
# do
#   PATH="${item/$DIR/}"
#   URL="${PATH/\[*\]/([a-z0-9-]+)/?}"
#   echo "location ~ ^/$URL {"
#   echo "  root $DIR;"
#   echo "  try_files"
#   echo "    \"/$PATH/index.html\""
#   echo "    proxy_pass;"
#   echo "}"
# done;

PATHS2=$(find $DIR | grep index.html)
for item in $PATHS2
do
  item=${item/index.html/}
  PATH="${item/$DIR/}"
  URL="${PATH/\///}"
  echo "location ~ ^/${PATH}* {"
  echo "  index index.html index.htm;"
  echo "  try_files \$uri /${PATH}index.html;"
  echo "}"
done;