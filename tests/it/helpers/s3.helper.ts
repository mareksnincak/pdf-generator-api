import {
  BucketAlreadyOwnedByYou,
  CreateBucketCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from '@aws-sdk/client-s3';

function getS3Client() {
  return new S3Client({
    credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    region: 'eu-central-1',
  });
}

export async function refreshS3Bucket(bucketName: string) {
  const client = getS3Client();

  try {
    await client.send(new CreateBucketCommand({ Bucket: bucketName }));
  } catch (error) {
    if (!(error instanceof BucketAlreadyOwnedByYou)) {
      throw error;
    }
  }

  const list = await client.send(new ListObjectsV2Command({ Bucket: bucketName }));
  const objects = list.Contents?.map(({ Key }) => ({ Key: Key! })) ?? [];

  if (objects.length > 0) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: { Objects: objects },
      }),
    );
  }
}

export async function putS3Object(bucketName: string, key: string, body: Buffer) {
  const client = getS3Client();
  await client.send(new PutObjectCommand({ Body: body, Bucket: bucketName, Key: key }));
}

export async function getS3Object(bucketName: string, key: string): Promise<Buffer> {
  const client = getS3Client();
  const result = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));

  if (!result.Body) {
    throw new Error('s3TestHelper.getS3Object.missingBody');
  }

  return Buffer.from(await result.Body.transformToByteArray());
}

export async function s3ObjectExists(bucketName: string, key: string): Promise<boolean> {
  const client = getS3Client();
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
    return true;
  } catch (error) {
    if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}
