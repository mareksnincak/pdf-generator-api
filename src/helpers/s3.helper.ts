import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  type ObjectIdentifier,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { logger } from './logger.helper';
import { captureAwsClient } from './tracing.helper';

let s3Client: S3Client | undefined;
let presignedUrlS3Client: S3Client | undefined;

function createS3Client(endpoint?: string): S3Client {
  const config: S3ClientConfig = {};
  if (endpoint) {
    config.endpoint = endpoint;
    // path-style URLs required when using a local endpoint (e.g. http://localhost:4566/bucket/key)
    config.forcePathStyle = true;
  }
  return captureAwsClient(new S3Client(config));
}

export function getS3Client() {
  if (!s3Client) {
    s3Client = createS3Client(process.env.S3_ENDPOINT);
  }

  return s3Client;
}

// Presigned URLs are returned to callers (browsers) so their host must be reachable
// from outside the Lambda container - S3_PRESIGNED_URL_ENDPOINT allows overriding the
// host independently of S3_ENDPOINT (e.g. localhost:4566 vs host.docker.internal:4566)
function getPresignedUrlS3Client() {
  if (!presignedUrlS3Client) {
    presignedUrlS3Client = createS3Client(
      process.env.S3_PRESIGNED_URL_ENDPOINT ?? process.env.S3_ENDPOINT,
    );
  }

  return presignedUrlS3Client;
}

export async function getObject({ bucket, key }: { bucket: string; key: string }) {
  const result = await getS3Client().send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  if (!result.Body) {
    throw new Error('s3Helper.getObject.missingBody');
  }

  const data = await result.Body.transformToByteArray();
  return Buffer.from(data);
}

export async function putObject({
  bucket,
  data,
  key,
}: {
  bucket: string;
  data: Uint8Array;
  key: string;
}) {
  await getS3Client().send(
    new PutObjectCommand({
      Body: data,
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function deleteObject({ bucket, key }: { bucket: string; key: string }) {
  logger.info({ bucket, key }, 's3Helper.deleteObject');

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );

  logger.info({ bucket, key }, 's3Helper.deleteObject.success');
}

export async function deleteObjects({ bucket, keys }: { bucket: string; keys: string[] }) {
  logger.info({ bucket, keys }, 's3Helper.deleteObjects');

  if (!keys.length) {
    logger.info('s3Helper.deleteObjects.skipping');
    return;
  }

  const objectsToDelete: ObjectIdentifier[] = keys.map((key) => ({
    Key: key,
  }));

  const result = await getS3Client().send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: objectsToDelete,
      },
    }),
  );

  if (result.Errors?.length) {
    const errorMsg = 's3Helper.deleteObjects.deletionErrors';
    logger.error({ errors: result.Errors }, errorMsg);
    throw new Error(errorMsg);
  }

  logger.info({ bucket, keys }, 's3Helper.deleteObjects.success');
}

export async function copyObject({
  destinationBucket,
  destinationKey,
  sourceBucket,
  sourceKey,
}: {
  destinationBucket: string;
  destinationKey: string;
  sourceBucket: string;
  sourceKey: string;
}) {
  await getS3Client().send(
    new CopyObjectCommand({
      Bucket: destinationBucket,
      CopySource: `${sourceBucket}/${sourceKey}`,
      Key: destinationKey,
    }),
  );
}

export async function moveObject({
  destinationBucket,
  destinationKey,
  sourceBucket,
  sourceKey,
}: {
  destinationBucket: string;
  destinationKey: string;
  sourceBucket: string;
  sourceKey: string;
}) {
  await copyObject({ destinationBucket, destinationKey, sourceBucket, sourceKey });
  await deleteObject({ bucket: sourceBucket, key: sourceKey });
}

export async function getPresignedShareUrl({
  bucket,
  expiresInSeconds = 3600,
  key,
}: {
  bucket: string;
  expiresInSeconds?: number;
  key: string;
}) {
  const client = getPresignedUrlS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function getPresignedUploadUrl({
  bucket,
  contentType,
  expiresInSeconds = 3600,
  fileSizeBytes,
  key,
}: {
  bucket: string;
  contentType?: string;
  expiresInSeconds?: number;
  fileSizeBytes: number;
  key: string;
}) {
  const client = getPresignedUrlS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    ContentLength: fileSizeBytes,
    ContentType: contentType,
    Key: key,
  });

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });
}
