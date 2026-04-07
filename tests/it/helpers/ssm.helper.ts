import { PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

function getSsmClient() {
  return new SSMClient({
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    endpoint: process.env.SSM_ENDPOINT,
    region: 'eu-central-1',
  });
}

export async function putSsmParameter(name: string, value: string) {
  await getSsmClient().send(
    new PutParameterCommand({ Name: name, Overwrite: true, Type: 'String', Value: value }),
  );
}
