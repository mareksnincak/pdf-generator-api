# Pin CI dependencies by hash

## Context

The CI/CD pipeline uses GitHub Actions and Docker images referenced by mutable tags such as `actions/checkout@v4` or `amazon/dynamodb-local:3.3.0`. Mutable tags can be silently updated by their maintainers at any time. A tag like `v4` is a floating pointer - the maintainer can move it to a new commit without any notification.

This means:

- A compromised maintainer account or a supply-chain attack can push malicious code under an existing tag, causing it to execute in our pipeline with full access to repository secrets (AWS deploy role ARN, environment names). This was a case e.g. in a recent Trivy hack.
- A workflow that passed today may fail or behave differently tomorrow due to a change outside our control.
- There is no way to detect that an action or image has changed between two runs when referencing by tag alone.

## Decision

Reference all GitHub Actions by their full commit SHA and all Docker images by their `sha256` content digest. The human-readable tag is retained as a comment so the intent remains clear:

GitHub Actions:

```yaml
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
```

Docker images:

```yaml
image: amazon/dynamodb-local@sha256:d89f8fcc6b1a39cb35976c248ed42a28c66ae00dc043099210f5571e42648ab4 # v3.3.0
```

A SHA is immutable. If a maintainer moves a tag, our pipeline continues to use exactly the code that was audited. Any update requires an explicit change in this repository, producing a diff that can be reviewed.

## Alternatives considered

### Continue using mutable tags

Simple to read and update. We choose not to accept this, as it silently exposes the pipeline to upstream changes and supply-chain attacks. A compromised `actions/checkout` would have full read access to the checked-out source and all secrets available to the job.

### Dependabot for automated hash updates

Automated tools can open PRs to update pinned SHAs when new versions are released, combining immutability with staying current. We choose not to adopt this immediately as the added tooling complexity is not yet justified, but it is a natural follow-on when the number of pinned dependencies grows.

### Fork and self-host all actions

Complete control over action code with no dependency on upstream maintainers. We choose not to do this, as the maintenance overhead of keeping forks current is higher than the residual risk of using pinned upstream SHAs from well-known publishers (GitHub, AWS, Docker).

## Consequences

- Supply-chain attacks that move a tag to malicious code have no effect on the pipeline.
- Pipeline executions are fully reproducible - the same SHA runs every time.
- Updating an action or image requires an intentional, reviewable commit — there are no silent upgrades.
- The human-readable tag comment preserves readability and makes it easy to assess whether an update is needed.
