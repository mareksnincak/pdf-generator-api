# PDF generator API

API for generating dynamic PDF documents.

## How to run

1. install dependencies
   ```bash
   npm i
   ```
1. run Docker
1. set local config
   ```bash
   cp config/values/local.config.example.json config/values/local.config.json
   # update values in config/values/local.config.json
   ```
1. expose AWS credentials in CLI:
   ```bash
   aws-vault exec dev
   ```
1. run infrastructure
   ```bash
   npm run infra:up
   ```
1. run app

   ```bash
   # Start API
   npm run start

   # Start API in watch mode
   npm run start:watch

   # Start API in debug mode
   npm run start:debug

   # Invoke single lambda function
   cp ./events/${LAMBDA_NAME}.event.example.json ./events/${LAMBDA_NAME}.event.json
   npm run invoke ${LAMBDA_NAME} -- --event ./events/${LAMBDA_NAME}.event.json

   # Invoke single lambda function in debug mode
   cp ./events/${LAMBDA_NAME}.event.example.json ./events/${LAMBDA_NAME}.event.json
   npm run invoke:debug ${LAMBDA_NAME} -- --event ./events/${LAMBDA_NAME}.event.json
   ```
