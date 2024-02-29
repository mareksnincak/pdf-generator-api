import { CopyObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { copyObject, deleteObject, moveObject } from './s3.helper';

afterEach(() => {
  jest.resetAllMocks();
});

describe('deleteObject', () => {
  it('should delete object', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const bucket = 'sample-bucket';
    const key = 'sample-key';

    await deleteObject({ bucket, key });

    const s3DeleteArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3DeleteArgs).toBeInstanceOf(DeleteObjectCommand);
    expect(s3ClientSpy.mock.lastCall?.[0].input).toEqual({
      Bucket: bucket,
      Key: key,
    });
  });
});

describe('copyObject', () => {
  it('should copy object', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const sourceBucket = 'source-bucket';
    const sourceKey = 'source-key';
    const destinationBucket = 'destination-bucket';
    const destinationKey = 'destination-key';

    await copyObject({ sourceBucket, sourceKey, destinationBucket, destinationKey });

    const s3CopyArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3CopyArgs).toBeInstanceOf(CopyObjectCommand);
    expect(s3CopyArgs.input).toEqual({
      Bucket: destinationBucket,
      CopySource: 'source-bucket/source-key',
      Key: destinationKey,
    });
  });
});

describe('moveObject', () => {
  it('should move object', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const sourceBucket = 'source-bucket';
    const sourceKey = 'source-key';
    const destinationBucket = 'destination-bucket';
    const destinationKey = 'destination-key';

    await moveObject({ sourceBucket, sourceKey, destinationBucket, destinationKey });

    const s3CopyArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3CopyArgs).toBeInstanceOf(CopyObjectCommand);
    expect(s3CopyArgs.input).toEqual({
      Bucket: destinationBucket,
      CopySource: 'source-bucket/source-key',
      Key: destinationKey,
    });

    const s3DeleteArgs = s3ClientSpy.mock.calls[1]?.[0];
    expect(s3DeleteArgs).toBeInstanceOf(DeleteObjectCommand);
    expect(s3DeleteArgs.input).toEqual({
      Bucket: sourceBucket,
      Key: sourceKey,
    });
  });
});
