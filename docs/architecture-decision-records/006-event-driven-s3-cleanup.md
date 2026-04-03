# Event-driven S3 cleanup

## Context

The application stores objects in S3 that have a limited lifetime - generated PDFs are only accessible via short-lived presigned URLs, and template upload slots are created speculatively (a user may request an upload URL but never complete the upload). Both types of object need to be deleted after they are no longer needed to avoid accumulating storage costs and stale data.

## Decision

Delete unused S3 objects using event-driven approach, by using DynamoDB streams and / or delayed message:

1. When a DynamoDB record is removed, a stream event fires. A Lambda reads the old image from the stream, extracts S3 key from the deleted record, and deletes the corresponding object.
2. At the time a temporary S3 object is created, an SQS message is enqueued with a delivery delay equal to the presigned URL expiry plus a small buffer. When the message is delivered, a Lambda deletes the object. This guarantees the object is not deleted before the URL expires.

## Alternatives considered

### Scheduled cleanup Lambda

Simple to implement and would work reliably even if deletion fails due to some temporary outage - it would perform cleanup on the next iteration. We choose not to use it would require querying for expired items, which would be costly operation. It would also introduce deletion lag.

## Consequences

- Objects are cleanup as soon as possible - there is minimal lag.
- DynamoDB is queried efficiently.
- Concept may be harder to grasp.
- When deletion fails, we need to handle it manually (e.g. by resending the DLQ message) - it won't be "fixed" on the next run.
