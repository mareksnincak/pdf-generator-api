import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  type ObjectIdentifier,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { logger } from './logger.helper';

let s3Client: S3Client | undefined;

export function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client();
  }

  return s3Client;
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
  return { data: Buffer.from(data) };
}

export async function putObject({
  bucket,
  key,
  data,
}: {
  bucket: string;
  key: string;
  data: Buffer;
}) {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
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
  sourceBucket,
  sourceKey,
  destinationBucket,
  destinationKey,
}: {
  sourceBucket: string;
  sourceKey: string;
  destinationBucket: string;
  destinationKey: string;
}) {
  await getS3Client().send(
    new CopyObjectCommand({
      CopySource: `${sourceBucket}/${sourceKey}`,
      Bucket: destinationBucket,
      Key: destinationKey,
    }),
  );
}

export async function moveObject({
  sourceBucket,
  sourceKey,
  destinationBucket,
  destinationKey,
}: {
  sourceBucket: string;
  sourceKey: string;
  destinationBucket: string;
  destinationKey: string;
}) {
  await copyObject({ sourceBucket, sourceKey, destinationBucket, destinationKey });
  await deleteObject({ bucket: sourceBucket, key: sourceKey });
}

export async function getPresignedShareUrl({
  bucket,
  key,
  expiresInSeconds = 3600,
}: {
  bucket: string;
  key: string;
  expiresInSeconds?: number;
}) {
  const client = getS3Client();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

export async function getPresignedUploadUrl({
  bucket,
  key,
  fileSizeBytes,
  expiresInSeconds = 3600,
}: {
  bucket: string;
  key: string;
  fileSizeBytes: number;
  expiresInSeconds?: number;
}) {
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentLength: fileSizeBytes,
  });

  return await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });
}
