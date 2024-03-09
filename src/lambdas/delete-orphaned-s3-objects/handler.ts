import type { Context, DynamoDBStreamEvent } from 'aws-lambda';

import { logger, setLoggerContext } from '../../helpers/logger.helper';

export async function deleteOrphanedS3Objects(
  event: DynamoDBStreamEvent,
  context: Context,
): Promise<void> {
  try {
    setLoggerContext({}, context);
    logger.info(event, 'deleteOrphanedS3Objects.starting');

    // const bucket = getEnvVariableOrFail('S3_BUCKET');

    // await deleteObjects({
    //   bucket,
    //   keys: keysToDelete,
    // });

    logger.info('deleteOrphanedS3Objects.success');
  } catch (error) {
    logger.error(error, 'deleteOrphanedS3Objects.error');
    throw error;
  }
}
