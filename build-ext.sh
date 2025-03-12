#!/bin/sh
echo "🛠  Packaging Browser Extension"
if [ -d ./dist ]; then
  cd dist
else
  echo "no ./dist dir found"
  exit 1
fi
TS=$(date +%Y)$(date +%m)010000
find -print | while read file; do
    touch -t $TS "$file"
    if [ $? -ne "0" ]; then
      echo "Error touching file ${file}"
      exit 2
    fi
done
DEFAULT_DEST="../leather-chromium.zip"
DEST=${1:-$DEFAULT_DEST}
zip -Xro $DEST *
if [ ! -f $DEST ]; then
  echo "Failed to create zipfile ${DEST}"
  exit 1
fi
echo "✅  Extension packaged as $(basename $DEST)"
exit 0
