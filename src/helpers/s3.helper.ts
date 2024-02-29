import { CopyObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';

let s3Client: S3Client | undefined;

// TODO tests
export function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client();
  }

  return s3Client;
}

export async function deleteObject({ bucket, key }: { bucket: string; key: string }) {
  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
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
