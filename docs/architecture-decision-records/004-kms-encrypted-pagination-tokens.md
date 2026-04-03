# KMS encrypted pagination tokens

## Context

DynamoDB pagination works by returning a `LastEvaluatedKey` that the client sends back on the next request. This key is a raw DynamoDB item key - if returned as-is (even base64-encoded), clients can decode it and learn the internal table structure (key prefixes, entity shape). A malicious client could also craft arbitrary keys to scan the table or access records belonging to other users.

## Decision

Encrypt the `LastEvaluatedKey` with AWS KMS before returning it to the client, and embed the requesting user's ID inside the plaintext. On the next request, decrypt the token and verify the embedded user ID matches the authenticated user before using it as a cursor.

## Alternatives considered

### Base64 encoded pagination token

This would be simplest to implement, but exposes internal table structure and allows token forgery or cross-user cursor reuse.

### Encrypt using locally stored secret instead of KMS key

We could encrypt the value using the secret stored in environment variables instead of using KMS to encrypt it. This would save us 1$ cost per month that we are paying for KMS secret. We choose to use KMS as it handles secret rotation seamlessly and incurred cost was acceptable for us.

### Use offset based pagination

Using offset based pagination would have an advantage of being the most common - most developers and integrators would be familiar with it. We choose no to use it as DynamoDB does not support offsets natively and implementing workarounds would have huge performance and cost implications when item count increases as it would require table scan.

### Sign instead of encrypt

This would ensure that pagination token is not modified, but would still expose internal table structure to users.

## Consequences

- Each paginated request requires a KMS API call for encryption/decryption - adds latency and cost per paginated page.
- KMS key rotation is handled transparently by AWS without changes to application code.
- 1$ monthly cost for KMS key
