import { CfnOutput } from 'aws-cdk-lib';
import { type RestApi } from 'aws-cdk-lib/aws-apigateway';
import { type Construct } from 'constructs';

export function createOutputs({ scope, api }: { scope: Construct; api: RestApi }) {
  new CfnOutput(scope, 'apiUrl', {
    value: api.url,
  });
}
