#!/bin/bash

docker compose -f infra/local/docker-compose-it.yml up --wait -d --build --force-recreate && \
AWS_SECRET_ACCESS_KEY=XXXXXXXX AWS_ACCESS_KEY_ID=XXXXXXXX \
jest --config ./tests/it/jest-it.config.ts --runInBand --color "$@"

result_code=$?

docker compose -f infra/local/docker-compose-it.yml down --rmi "local" --volumes

exit "$result_code"
