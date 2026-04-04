# Observability guide

We are using these mechanisms to help with the observability:

1. Logging using Pino
2. Tracing using AWS X-Ray
3. Error tracking using Sentry
4. Alerting using CloudWatch Alarms

Below are the quick guides how to use each one.

## Logging

Each Lambda has a dedicated log group named after the function. Logs can be seen either by selecting the log group and checking the content or by querying the data using CloudWatch Log Insights. To use CloudWatch Log Insights open the [CloudWatch Log Insights UI](https://console.aws.amazon.com/cloudwatch/home#logsV2:logs-insights), select the relevant log group(s) and time period and write the query to fetch the data you are searching for (see examples below). Don't use large time periods whenever possible as cost is based on amount of scanned data.

### Find last 50 errors

```
fields @timestamp, @message
| filter @message like /error/
| sort @timestamp desc
| limit 50
```

### Find all logs for a specific request

```
fields @timestamp, @message
| filter @requestId = "aws-request-id-here"
| sort @timestamp desc
```

## Tracing - AWS X-Ray

Every Lambda invocation is traced. DynamoDB, S3, SQS, SFN, and KMS calls appear as subsegments with latency and fault data.

Open the [X-Ray Traces console](https://console.aws.amazon.com/xray/home#/traces).

1. Filter by function name or time range to find the relevant trace.
2. Click a trace to see the full segment timeline - each AWS SDK call is a labelled subsegment showing duration and whether it faulted.
3. Use the **Service Map** (left menu) to get a live call graph of the whole system and spot which service is degraded.

## Errors - Sentry

Sentry captures all unhandled errors with full stack trace, request context, and Pino log breadcrumbs.

Open the Sentry project dashboard and filter by environment or time range.

Each event includes:

- Stack trace and error message
- Lambda function name and AWS request ID
- User ID (from structured log context)
- Log breadcrumbs leading up to the error

Use the AWS request ID from Sentry to cross-reference with CloudWatch logs or an X-Ray trace.

## Alerting - CloudWatch Alarms

Sentry covers Lambda errors, but some failure modes produce no exception - a message silently exhausting SQS retries, or a Step Functions execution being throttled before any Lambda runs. CloudWatch Alarms cover these blind spots and send an email notification via SNS when triggered. The destination email is configured via the `pdf-generator-api-alarm-email` SSM parameter via Terraform. Open [CloudWatch Alarms](https://console.aws.amazon.com/cloudwatch/home#alarmsV2) to check current alarm states.
