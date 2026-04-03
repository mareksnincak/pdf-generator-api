# Serverless architecture

## Context

We want to be able to generate PDFs without incurring huge costs. Our load is not stable but fluctuates - there are long periods of times when PDF generation is not needed, but when it's needed there can be many requests. We are not able to predict the load.

## Decision

Use serverless stack based on Lambda and DynamoDB that would be automatically initialized only when needed. Serverless nature of both services ensures that costs when not used are very low and ability to auto scale ensures that it can handle the high load as well.

## Alternatives considered

### Application

#### EC2 (EKS / ECS)

This would have a benefit of using approach most developers are more familiar with. We choose not to use it as costs would be much higher.

### DB

#### Serverless Aurora v1

Using Serverless Aurora v1 would allow us to auto-scale relational database such as Postgres so it can be shut down during periods of inactivities and scaled up in high load scenarios. It would also allow us to use more common relational database, that developers are more familiar with. We choose not to use it, as cold start for Serverless Aurora v1 is much slower - its not acceptable to wait 30-60 seconds to have PDF generated.

#### Serverless Aurora v2

Similar to Serverless Aurora v1, Serverless Aurora v2 would offer similar benefits. One difference is, that it doesn't allow to scale down to 0, which would mean costs are still much higher than DynamoDB.

#### RDS

Using RDS would offer relational database benefits, but costs would be much higher, especially for low activity periods, as we are paying for hours it's running instead of usage.

#### Managed relational DB somewhere else

This would offer relational database benefits, while possibly having lower costs than RDS. We choose not to use it as this would split our infrastructure, possibly conflict with data retention policies, and still cost more when compared to DynamoDB. Using backups outside of AWS would also be more painful.

#### Self hosted relational DB

Similar to Managed relational DB somewhere else, with possibly lower costs for infrastructure. We choose not to use it for similar reasons, but especially because it would require much more maintenance.

## Consequences

- Cost is cheap when load is low
- Application is able to scale efficiently even under high load
- First request would have a bit of delay (~1-2s) - cold start issue
- Developers need to learn new technology
- Data modeling requires more thought
