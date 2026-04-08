import { PutParameterCommand } from '@aws-sdk/client-ssm';

import { getSsmClient } from '../../../src/helpers/ssm.helper';

export async function putSsmParameter(name: string, value: string) {
  await getSsmClient().send(
    new PutParameterCommand({ Name: name, Overwrite: true, Type: 'String', Value: value }),
  );
}
