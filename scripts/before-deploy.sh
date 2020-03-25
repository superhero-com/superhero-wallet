#!/bin/bash
set -e

if [[ $CNAME != "" ]]; then
  echo $CNAME > dist/web/root/CNAME
fi
