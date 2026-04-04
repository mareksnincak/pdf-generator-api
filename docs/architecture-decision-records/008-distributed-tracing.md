# Distributed tracing

## Context

The application uses an event-driven, multi-service architecture: API Gateway → Lambda, Lambda → SQS → Lambda, Lambda → Step Functions → Lambda, and various AWS service calls (DynamoDB, S3, KMS). When a failure occurs mid-flow - for example during batch PDF generation or after a malware scan result - there is no mechanism to trace the request path across service boundaries. Pino structured logging exists per Lambda invocation but does not connect correlated executions into a single trace.

Two complementary observability needs exist: error tracking with rich user/request context (stack traces, user IDs, alerting), and distributed tracing across async boundaries (end-to-end latency, per-service subsegments, service topology map).

## Decision

Use AWS X-Ray for distributed tracing alongside the existing Sentry integration. The two tools solve different problems and do not duplicate each other - Sentry handles error tracking, alerting, and user context, while X-Ray handles distributed traces, the service map, and per-SDK-call latency.

Each Lambda invocation automatically creates an X-Ray segment. AWS SDK calls within it appear as subsegments labelled by service and operation, giving per-call latency and fault information across async boundaries.

## Alternatives considered

### Sentry performance monitoring only

Sentry offers performance tracing (transactions and spans) and its Lambda integration wraps invocations automatically. We choose not to rely on it alone, as it does not instrument native AWS SDK calls (DynamoDB, S3, SQS) as subsegments, does not produce a service map, and cannot propagate trace context across SQS message boundaries in the way X-Ray does natively within AWS infrastructure.

### Dynatrace

Dynatrace provides distributed tracing, metrics, log correlation, and AI-assisted anomaly detection in one platform. We choose not to use it, as the cost is significantly higher than X-Ray (agent-based pricing typically starts at ~$70/month per host-equivalent), it requires an additional third-party agent layer and a Dynatrace environment to operate, and the added complexity is not justified at current scale.

### Datadog APM

Datadog provides distributed tracing, metrics, and log correlation in one platform. We choose not to use it, as the cost per Lambda is significantly higher than X-Ray and it requires an additional third-party agent layer with no meaningful capability advantage for this workload.

### No distributed tracing

Acceptable if all processing was synchronous. We choose not to accept this, as due to the async architecture (SQS-triggered Lambdas, Step Functions batch flows) and reliance on many AWS services means that without tracing, failures in downstream services are difficult to diagnose.

## Consequences

- Every Lambda invocation is traced. The X-Ray service map shows the live call graph between Lambda functions and downstream AWS services.
- DynamoDB, S3, SQS, SFN, and KMS calls appear as named subsegments with latency and fault data.
- No code changes are needed in individual handlers - instrumentation is centralized in the shared client helpers and the CDK stack definition.
- Costs are negligible at the expected request volume.
