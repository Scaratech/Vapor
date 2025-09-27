#!/bin/bash
mkdir ./build/ 2>/dev/null
node ./scripts/build.js >/dev/null 2>&1
mv ./dist/* ./build/
cp -r ./public/* ./build/
mv ./dist-sw/sw.js ./build/sw.js
rm -rf ./dist/ ./dist-sw/
echo "Build completed successfully!"