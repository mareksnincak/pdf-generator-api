import type { Context, SQSEvent } from 'aws-lambda';

import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { deleteObjects } from '../../helpers/s3.helper';

export async function deleteExpiredS3Objects(event: SQSEvent, context: Context): Promise<void> {
  try {
    setLoggerContext({}, context);
    logger.info('deleteExpiredS3Objects.starting');

    const bucket = getEnvVariableOrFail('S3_BUCKET');
    const keysToDelete = event.Records.map((record) => record.body);
    await deleteObjects({
      bucket,
      keys: keysToDelete,
    });

    logger.info('deleteExpiredS3Objects.success');
  } catch (error) {
    logger.error(error, 'deleteExpiredS3Objects.error');
    throw error;
  }
}
