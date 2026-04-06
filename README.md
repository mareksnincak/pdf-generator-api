# PDF Generator API

[![CI/CD](https://github.com/mareksnincak/pdf-generator-api/actions/workflows/ci-cd.workflow.yml/badge.svg?branch=main)](https://github.com/mareksnincak/pdf-generator-api/actions/workflows/ci-cd.workflow.yml)

API for generating dynamic PDF documents using serverless stack.

- [Architecture highlights](#architecture-highlights)
  - [Architecture decision records](docs/architecture-decision-records/README.md)
- [API documentation](#api-documentation)
- [How to run](#how-to-run)
- [How to test](#how-to-test)
  - [Unit tests](#unit-tests)
  - [Integration tests](#integration-tests)
  - [E2e tests](#e2e-tests)
  - [Running single test only](#running-single-test-only)
- [How to deploy](#how-to-deploy)

## Architecture highlights

> Key design decisions including alternatives considered and tradeoffs are documented as [Architecture decision records](docs/architecture-decision-records/README.md).

The API accepts requests authenticated via Cognito, generates PDFs inside Lambda using headless Chromium, stores templates and batch results in DynamoDB, and uses Step Functions to orchestrate multi-document jobs. Infrastructure is fully managed with CDK and Terraform.

### Serverless PDF generation

PDF rendering runs inside AWS Lambda using [Puppeteer](https://pptr.dev/). HTML templates are rendered via [Handlebars](https://handlebarsjs.com/). See [`src/lambdas/generate-document/services/pdf.service.ts`](src/lambdas/generate-document/services/pdf.service.ts) and [ADR: Serverless architecture](docs/architecture-decision-records/001-serverless-architecture.md).

### KMS-encrypted pagination tokens

DynamoDB's `LastEvaluatedKey` is encrypted with KMS before being returned to clients as a pagination token, preventing cursor tampering and leakage of internal table structure. See [`src/db/common/helpers/pagination.helper.ts`](src/db/common/helpers/pagination.helper.ts) and [ADR: KMS-encrypted pagination tokens](docs/architecture-decision-records/004-kms-encrypted-pagination-tokens.md).

### DynamoDB single-table design

Data is stored using [single table design pattern](https://aws.amazon.com/blogs/compute/creating-a-single-table-design-with-amazon-dynamodb/) - entities share one DynamoDB table using prefixed composite keys (`TEMPLATE#USER#{userId}#ID#{id}`) with a GSI for secondary access patterns. See [`src/db/`](src/db/) and [ADR: Single-table DynamoDB design](docs/architecture-decision-records/003-single-table-dynamodb-design.md).

### AWS Step Functions batch orchestration

Batch document generation is orchestrated by a [Step Functions state machine](https://aws.amazon.com/step-functions/) that maps over documents in parallel, invoking a Lambda for each one. See [`infra/cdk/stack/sfn.ts`](infra/cdk/stack/sfn.ts) and [ADR: Step Functions for batch orchestration](docs/architecture-decision-records/005-step-functions-for-batch-orchestration.md).

### Event-driven S3 cleanup

S3 objects are cleaned up through two event-driven flows rather than scheduled jobs:

1. When a DynamoDB record is deleted (template or document batch, via explicit delete or TTL expiry), a stream event triggers a Lambda that deletes the corresponding S3 objects.
2. Temporary S3 objects (generated PDFs, unused template uploads) are deleted after a configurable delay via a delayed SQS message - scheduled at the time the object is created, timed to expire shortly after the presigned URL does.

See [`infra/cdk/stack/dynamo.ts`](infra/cdk/stack/dynamo.ts), [`infra/cdk/stack/sqs.ts`](infra/cdk/stack/sqs.ts) and [ADR: Event-driven S3 cleanup](docs/architecture-decision-records/006-event-driven-s3-cleanup.md).

### GuardDuty malware scanning for uploaded templates

Uploaded templates are automatically scanned for malware using [AWS GuardDuty Malware Protection for S3](https://docs.aws.amazon.com/guardduty/latest/ug/gdu-malware-protection-s3.html). On every upload, GuardDuty scans the object and emits the result to EventBridge. A Lambda processes the result and updates the template's malware scan status. When template is infected document generation is blocked. Infected files are moved to a quarantined S3 location and expire after 30 days via a lifecycle rule. See [`src/lambdas/process-malware-scan-result/`](src/lambdas/process-malware-scan-result/), [`infra/cdk/stack/guardduty.ts`](infra/cdk/stack/guardduty.ts) and [ADR: GuardDuty malware scan](docs/architecture-decision-records/007-guardduty-malware-scan.md).

### Observability

Structured logging uses [Pino](https://getpino.io/) with per-request context injection. [Sentry](https://sentry.io/) wraps each Lambda handler to automatically capture errors. [AWS X-Ray](https://aws.amazon.com/xray/) provides distributed tracing across async boundaries - every Lambda invocation is traced and DynamoDB, S3, SQS, SFN, and KMS calls appear as named subsegments, making it possible to follow a request across the full Lambda → SQS → Lambda and Step Functions chains. CloudWatch Alarms cover the failure modes Sentry cannot see: DLQ messages (persistent S3 cleanup failures), and Step Functions batch execution failures and throttles. See [`src/helpers/handler.helper.ts`](src/helpers/handler.helper.ts), [`src/helpers/tracing.helper.ts`](src/helpers/tracing.helper.ts), [`infra/cdk/stack/monitoring.ts`](infra/cdk/stack/monitoring.ts), [observability guide](docs/guides/observability.md) and [ADR: Distributed tracing](docs/architecture-decision-records/008-distributed-tracing.md).

### Cognito OAuth2 with custom scopes

Authentication uses Cognito with a custom OAuth2 resource server and fine-grained scopes: `templates:read`, `templates:write`, `documents:generate`, and `admin`. API Gateway enforces scopes per route. See [`infra/cdk/stack/cognito.ts`](infra/cdk/stack/cognito.ts).

### IaC: CDK + Terraform

Infrastructure is split across two tools by responsibility:

1. Terraform bootstraps environment configuration (SSM parameters) that must exist before the app is deployed - keeps values out of CDK and independently manageable.
2. CDK deploys all application resources (Lambdas, API Gateway, DynamoDB, Step Functions, Cognito, KMS, SQS, S3) and reads config from SSM at deploy time.

See [`infra/cdk/`](infra/cdk/), [`infra/terraform/`](infra/terraform/) and [ADR: IaC tooling](docs/architecture-decision-records/002-iac-tooling.md).

### Code-first OpenAPI

The API schema is generated from the same Zod schemas used for runtime validation, via [`zod-to-openapi`](https://github.com/asteasolutions/zod-to-openapi). The spec is served live at the `/` endpoint. See [`src/open-api/`](src/open-api/).

### CI/CD pipeline

GitHub Actions runs lint, unit tests, and integration tests on every pull request. On merge to `main`, the pipeline deploys via CDK and then runs E2E tests against the live (dev) environment - E2E tests run directly after deploy and use variables generated by deploy. AWS authentication uses OIDC via an IAM role defined in Terraform - no long-lived credentials are stored as secrets. See [`.github/workflows/ci-cd.workflow.yml`](.github/workflows/ci-cd.workflow.yml).

### Three-tier test strategy

Unit tests run in full isolation with mocked dependencies. Integration tests run against a real DynamoDB instance (Docker). E2E tests run against the real API, either locally or against a deployed environment. See [How to test](#how-to-test).

## API documentation

OpenAPI documentation is available on root (`/`) url.

It is also possible to generate OpenAPI document manually:

```bash
npm run open-api:generate
```

## How to run

1. [install AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html#install-sam-cli-instructions)
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
1. [set up AWS credentials](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html) that can be used by the app. Suggested setups:
   1. use AWS SSO and setup default credentials in `~/.aws/config`
   1. use AWS SSO with custom profile and export profile name in `AWS_PROFILE` environment variable
   1. use aws-vault to expose credentials in CLI
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

## How to deploy

See [infra documentation](infra/README.md).
