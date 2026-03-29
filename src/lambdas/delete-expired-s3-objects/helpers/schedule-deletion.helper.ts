import { getEnvVariableOrFail } from '../../../helpers/env.helper';
import { sendSqsMessage } from '../../../helpers/sqs.helper';

export async function scheduleObjectDeletion({
  deleteInSeconds,
  key,
}: {
  deleteInSeconds?: number;
  key: string;
}) {
  const queueUrl = getEnvVariableOrFail('DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL');
  await sendSqsMessage({
    body: key,
    delaySeconds: deleteInSeconds,
    queueUrl,
  });
}
