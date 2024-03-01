# PDF generator API

API for generating dynamic PDF documents.

- [How to run](#how-to-run)
- [How to test](#how-to-test)
  - [Unit tests](#unit-tests)
  - [Integration tests](#integration-tests)
  - [E2e tests](#e2e-tests)
  - [Running single test only](#running-single-test-only)

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
E2E_BASE_URL=$DEPLOYED_ENV_URL npm run test:e2e
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

- E2e tests need either locally running app or `E2E_BASE_URL` set
