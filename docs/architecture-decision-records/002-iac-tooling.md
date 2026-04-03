# IaC tooling

## Context

We want to have automated way to provision infrastructure for our application. The application requires two categories of infrastructure: application resources (Lambdas, API Gateway, DynamoDB, etc.) and external configuration (Sentry DSN, environment-specific values stored as SSM parameters). These have different ownership and lifecycle characteristics.

Application resources change frequently - every deploy may update Lambda code, environment variables, or resource configuration. External configuration changes rarely and often requires manual input to fill in the actual value.

## Decision

Split infrastructure management by responsibility:

- `Terraform` - manages SSM parameters and secrets that needs manual input to fill in the values. It runs once on environment bootstrap and only when configuration changes.
- `CDK` - manages all application resources and reads configuration from SSM at deploy time using parameter lookups. CDK never stores or manages the values themselves.

## Alternatives considered

### CDK for provisioning both infra and parameters

Using CDK for provisioning both infra and parameters would have an advantage of only using one tool for everything which would in theory simplify the infrastructure. We choose not to use it, as by default CDK overrides parameter value to hardcoded value on each deploy. This would cause our secrets to be "reset" (lost) on each deploy. To persist them we could create a custom CFN lambda resource that would create the param only if it does not exist, but that solution would be more of a hack than standard, and there was a risk . That's why we choose to do this with Terraform as it's tried and tested for cases like this.

### SST instead of CDK

Using SST to deploy our stack instead of CDK would have an advantage of faster hot reloads in our Lambdas. We choose not to use it as at the time there was no support for Step Functions. So instead of trying to hack it we went with solution that supported all of our needs. We may reconsider when the support for Step Functions is properly added to SST (not beta) and we feel like hot reloads are holding us back, but we would be risking similar situation with some new service that AWS introduces in the future.

### Pulumi instead of Terraform

Using Pulumi instead of Terraform would have advantage of writing this part of infrastructure in TypeScript as well. We choose not to use it as Terraform is still the most used tool for this job and our setup is fairly simple so we didn't benefit much from the added type safety.

## Consequences

- First deploy of a new environment requires two steps: `terraform apply` then CDK deploy.
- Configuration and application infrastructure can be updated independently without risk of interfering with each other.
- Terraform state must be stored and managed.
- Lambda hot reloads are not instant during development.
