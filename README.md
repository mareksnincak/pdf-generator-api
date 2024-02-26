# PDF generator API

## Prerequisites

1. run Docker
1. expose AWS credentials in CLI:
   ```bash
   aws-vault exec dev
   ```

## How to run

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
   npm run invoke ${LAMBDA_NAME} -- --event ./events/${LAMBDA_NAME}.event.json

   # Invoke single lambda function in debug mode
   npm run invoke:debug ${LAMBDA_NAME} -- --event ./events/${LAMBDA_NAME}.event.json
   ```
