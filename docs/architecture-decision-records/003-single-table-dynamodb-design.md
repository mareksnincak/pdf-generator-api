# Single table DynamoDB design

## Context

The application manages two main entities: templates (owned by a user, listed and looked up by name) and document batches (created per generation job, fetched by ID). DynamoDB is the primary data store.

The straightforward approach would be one table per entity type, mirroring a relational schema. However, DynamoDB pricing and performance are driven by the number of requests, not the complexity of queries - and cross-table joins do not exist, meaning any operation spanning entities requires multiple round trips.

## Decision

Store all entities in a single DynamoDB table using composite keys with entity-type prefixes - single table design. This way we can store multiple access patterns in the single table and accessing the items is very efficient even in huge scales. Drawbacks of this is that it's not very intuitive for developers that are not familiar with this, there is some data duplication and for applications with lot of new usage patterns it may be hard to adjust the schema to fit them.

## Alternatives considered

### Multiple tables

This would have advantage of being simpler to grasp. We choose not to use it, as this is less efficient to scale and often requires multiple requests for each operation - it's basically like using relational DB without joins.

### Relational DB

This would have an advantage of being simpler to grasp while still offering good enough performance. We choose not to use it due to incurred costs, as explained in [001-serverless-pdf-generation docs](docs/architecture-decision-records/001-serverless-pdf-generation.md).

## Consequences

- Performance is great even in huge scales.
- Cost remains cheap.
- When there is a new access pattern, it's more difficult to accommodate it - schema changes are more difficult to perform.
- Data modelling is less intuitive - most developers are not familiar with it.
