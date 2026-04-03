# Step Functions for batch document generation

## Context

Batch generation requires invoking PDF generation for each document in a request, potentially dozens at a time. Each invocation is independent but the results need to be collected and stored. Individual invocations can fail and those failures should not abort the entire batch.

Lambda has a 15-minute execution limit, making a single Lambda that loops over all documents risky for large batches. Any failure mid-loop would also lose all progress.

## Decision

Use an AWS Step Functions state machine to orchestrate batch generation. A `Map` state fans out over the document array in parallel, invoking the generation Lambda for each item. Each item has its own `Catch` branch - failures are caught and persisted per item without affecting others. Execution history is visible in the AWS console, making debugging straightforward. Drawbacks are the additional costs for each step transition.

## Alternatives considered

### Single Lambda with a loop

This would be simplest to implement. We choose not to use it, as it would take much longer to run and possibly even hit the 15 minute execution limit and fail. Error handling and traceability would also be much worse.

### SQS fan-out

Each document would be pushed to a SQS queue which would trigger Lambda. This would be similarly efficient to Step Functions, but we choose not to use it, as collecting results and tracing the errors would be more difficult.

## Consequences

- The batch execution is easily traceable and debugging is easier.
- Cost is low, but a bit higher than SQS fan-out as we are paying for step transitions.
