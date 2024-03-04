import type { Context, SQSEvent } from 'aws-lambda';

import { logger, setLoggerContext } from '../../helpers/logger.helper';
import { deleteObjects } from '../../helpers/s3.helper';

export async function deleteExpiredS3Objects(event: SQSEvent, context: Context): Promise<void> {
  try {
    setLoggerContext(event, context);
    logger.info('deleteExpiredS3Objects.starting');

    const bucket = process.env.S3_BUCKET;
    if (!bucket) {
      throw new Error('deleteExpiredS3Objects.missingBucket');
    }

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
