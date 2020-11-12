#!/bin/bash
set -ex

if [[ $CNAME != "" ]]; then
  echo $CNAME > dist/web/root/CNAME
fi

npm run build-zip
cp -r dist/web/root dist-stage
mv dist-zip dist-stage/artifacts
mv tests/pages/index.html dist-stage/artifacts/deeplink-test.html
