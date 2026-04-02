import type { SQSEvent } from 'aws-lambda';

import { getEnvVariableOrFail } from '../../helpers/env.helper';
import { ErrorFormat } from '../../helpers/error.helper';
import { wrapHandler } from '../../helpers/handler.helper';
import { logger } from '../../helpers/logger.helper';
import { deleteObjects } from '../../helpers/s3.helper';

async function handler(event: SQSEvent) {
  logger.info('deleteExpiredS3Objects.starting');

  const bucket = getEnvVariableOrFail('S3_BUCKET');
  const keysToDelete = event.Records.map((record) => record.body);
  await deleteObjects({
    bucket,
    keys: keysToDelete,
  });

  logger.info('deleteExpiredS3Objects.success');
}

export const deleteExpiredS3Objects = wrapHandler(handler, {
  errorFormat: ErrorFormat.RAW,
  logPrefix: 'deleteExpiredS3Objects',
});
