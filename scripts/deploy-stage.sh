#!/bin/bash
set -ex

APP_NAME=wallet

echo "${DEPLOY_KNOWN_HOSTS_BASE64}" | base64 --decode >> ~/.ssh/known_hosts
echo "${DEPLOY_USER_KEY_BASE64}" | base64 --decode > /tmp/user-key
eval "$(ssh-agent -s)"
chmod 600 /tmp/user-key
ssh-add /tmp/user-key

DOMAIN=`echo $TRAVIS_BRANCH | tr '[:punct:]' '-'`

rsync -e "ssh -p 2022" -r -v dist-stage/* root@z52da5wt.xyz:/data/$APP_NAME/$DOMAIN

URL=$DOMAIN.$APP_NAME.z52da5wt.xyz
echo "Deployed to $URL"
curl -H "Authorization: token ${GITHUB_TOKEN}" -X POST \
  -d "{\"body\": \"Deployed to [$URL](https://$URL), [artifacts](https://$URL/artifacts)\"}" \
  "https://api.github.com/repos/${TRAVIS_REPO_SLUG}/commits/${TRAVIS_COMMIT}/comments"
