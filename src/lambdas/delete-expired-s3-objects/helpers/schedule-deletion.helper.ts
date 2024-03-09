import { getEnvVariableOrFail } from '../../../helpers/env.helper';
import { sendSqsMessage } from '../../../helpers/sqs.helper';

export async function scheduleObjectDeletion({
  key,
  deleteInSeconds,
}: {
  key: string;
  deleteInSeconds?: number;
}) {
  const queueUrl = getEnvVariableOrFail('DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL');
  await sendSqsMessage({
    queueUrl,
    body: key,
    delaySeconds: deleteInSeconds,
  });
}
