#!/bin/sh

rm -rf ./docs && mkdir ./docs
docker run --rm -it -v ${PWD}/nuxt3:/app -w /app node:18 yarn generate
cp -rv ./nuxt3/.output/public/* ./docs/