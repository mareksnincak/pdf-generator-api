# PDF generator API

API for generating dynamic PDF documents.

- [API documentation](#api-documentation)
- [How to run](#how-to-run)
- [How to test](#how-to-test)
  - [Unit tests](#unit-tests)
  - [Integration tests](#integration-tests)
  - [E2e tests](#e2e-tests)
  - [Running single test only](#running-single-test-only)

## API documentation

OpenAPI documentation is available on root (`/`) url.

It is also possible to generate OpenAPI document manually:

```bash
npm run open-api:generate
```

## How to run

### Prerequisites

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) with [authentication setup](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

### Steps to run

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
1. export aws profile name to AWS_PROFILE env variable:
   ```bash
   export AWS_PROFILE=<PROFILE_NAME>
   # export AWS_PROFILE=dev
   ```
1. expose AWS credentials in CLI:
   ```bash
   aws sso login --sso-session $AWS_PROFILE
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

## How to test

App contains 3 types of tests - unit, integration and e2e.

### Unit tests

Contain tests only related to that files. All other services outside tested file should be mocked.
They are located near file that they are testing and use `.test.ts` suffix.

To run:

```bash
npm run test
```

### Integration tests

Contain tests related to module as a whole - e.g. all lambda logic not just single file.
They run against real database. External services such as 3rd party APIs are mocked.
They are located in `tests/it` folder and use `.it.test.ts` suffix.

To run:

```bash
npm run test:it
```

### E2e tests

Contain tests running against real resources using real app API. Nothing is mocked in this case.
They are located in `tests/e2e` folder and use `.e2e.test.ts` suffix.

To run against local app:

```bash
# first terminal
npm run start

# second terminal
npm run test:e2e
```

To run against deployed app:

```bash
E2E_BASE_URL=$DEPLOYED_ENV_URL \
E2E_AUTH_USER_POOL_ID=$USER_POOL_ID \
E2E_AUTH_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID \
E2E_AUTH_USER_CREDENTIALS_SECRET_NAME=$USER_CREDENTIALS_SECRET_NAME \
npm run test:e2e
```

### Running single test only

Simplest way to run single test only is to use [Jest Runner VS Code](https://marketplace.visualstudio.com/items?itemName=firsttris.vscode-jest-runner) extension.

- Unit tests can be run without any additional setup
- Integration tests need test infrastructure:

  ```bash
  npm run it-infra:up

  # cleanup
  # npm run it-infra:down
  ```

- E2e tests need either locally running app or [deployed app credentials set](#e2e-tests).
