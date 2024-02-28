#!/bin/bash

docker compose -f infra/local/docker-compose-it.yml up -d --build --force-recreate && \
AWS_SECRET_ACCESS_KEY=it-test AWS_ACCESS_KEY_ID=it-test NODE_ENV=development \
jest --config ./tests/it/jest-it.config.ts --runInBand --color "$@"

result_code=$?

docker compose -f infra/local/docker-compose-it.yml down --rmi "local" --volumes

exit "$result_code"
