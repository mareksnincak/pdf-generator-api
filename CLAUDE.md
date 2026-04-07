# CLAUDE.md

Serverless AWS API for generating PDF documents from Handlebars HTML templates. Lambdas handle individual operations; Step Functions orchestrate batch generation. Single DynamoDB table stores templates and document batches.

## Commands

```sh
npm test                  # unit tests
npm run test:it           # integration tests (starts Docker automatically)
npm run typecheck         # tsc
npm run lint              # prettier + eslint
npm run synth             # CDK synth → cdk.out/
npm run start             # synth + SAM local API on port 3000
npm run invoke            # synth + SAM invoke single Lambda
npm run infra:up          # start local Docker infra (DynamoDB, S3) - run this before start or invoke
npm run infra:down        # stop local Docker infra
npm run open-api:generate # regenerate OpenAPI spec from Zod schemas
```

## Critical rules

- Follow security best practices
- Fix lint and type issues, don't disable or relax the rules
- No `any` — use proper types or `unknown` with narrowing
- After every code change, run `npm run typecheck && npm run lint && npm run test && npm run test:it` and fix all errors before considering the task done
- Pin all Docker images and GitHub Actions by their immutable hash, never by mutable tag. Keep the human-readable tag as a comment. Docker: `image: org/name@sha256:<digest> # vX.Y.Z`. GitHub Actions: `uses: actions/name@<commit-sha> # vX.Y.Z`.

## Philosophy

- Correctness > cleverness
- Real problems only
- Comments explain context / reasoning, not what the code is doing
- One concept per PR
- Descriptive names > brevity
- No unrelated changes
- Reuse concepts that already exist in codebase

## Code patterns

### Error handling

Throw `HttpError` subclasses for expected failure conditions. Throw plain `Error` for unexpected internal failures.
All user-facing error messages live in `src/enums/error.enum.ts` — add new ones there rather than inline strings. For plain errors use `{prefix}.{action}` convention that we use for log messages.

```ts
throw new ConflictError({ message: ErrorMessage.templateAlreadyExists });
throw new Error('s3Helper.getObject.missingBody');
```

### Logging

Use the shared `logger` from `src/helpers/logger.helper.ts`. Log at entry and exit of significant operations. Use the `{prefix}.{action}` convention that exists throughout the codebase (e.g. `templateRepository.getById`, `createTemplate.validatedData`). Internal scripts (e.g. `src/open-api/`) may use `console.log`.

```ts
logger.info(params, 'templateRepository.getById');
```

## Testing

Cover application functionality with tests - three tiers — pick the right one for what you are testing:

| Tier        | File suffix    | What it tests                                               | How to run         |
| ----------- | -------------- | ----------------------------------------------------------- | ------------------ |
| Unit        | `.test.ts`     | Business logic, mocks all I/O                               | `npm test`         |
| Integration | `.it.test.ts`  | Lambda handlers against real DynamoDB, S3, SQS, SSM (floci) | `npm run test:it`  |
| E2E         | `.e2e.test.ts` | Full API against deployed or local SAM                      | `npm run test:e2e` |
