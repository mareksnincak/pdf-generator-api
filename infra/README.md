# Infra

We are using these tools to setup our infra:

1. [Docker Compose](https://docs.docker.com/compose/) - used only locally, to setup infrastructure for local development
1. [Terraform](https://developer.hashicorp.com/terraform) - to setup config variables (create SSM parameters / secrets)
1. [CDK](https://aws.amazon.com/cdk/) - to setup application infrastructure

## Deploy

To do the deploy to new env follow these steps:

1. Ensure you are logged in to AWS in your CLI.
   ```sh
   aws sso login --profile <profile>
   ```
1. Apply the terraform and fill in the values - only needed on the first deploy or when adding new value
   ```sh
   AWS_PROFILE=<profile> terraform apply
   ```
1. Deploy the app - preferably let the CI deploy job handle this.
   ```sh
   AWS_PROFILE=<profile> ENVIRONMENT_NAME=<environment> npm run deploy:prod
   ```
