#!/bin/sh

rm -rf ./docs
docker run --rm -it -v ${PWD}/nuxt3:/app -w /app node:18 yarn generate
sudo chmod 0777 -R ./nuxt3/.output/public
mv ./nuxt3/.output/public ./docs/