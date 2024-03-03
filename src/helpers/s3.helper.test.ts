import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as requestPresigner from '@aws-sdk/s3-request-presigner';

import {
  copyObject,
  deleteObject,
  getPresignedShareUrl,
  getPresignedUploadUrl,
  moveObject,
} from './s3.helper';

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@aws-sdk/s3-request-presigner'),
  };
});

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

describe('getPresignedShareUrl', () => {
  it('should return presigned getObject url', async () => {
    const mockedUrl = 'http://mocked.example.com/path';
    const getSignedUrlSpy = jest
      .spyOn(requestPresigner, 'getSignedUrl')
      .mockResolvedValue(mockedUrl);

    const bucket = 'sample-bucket';
    const key = 'sample-key';

    const result = await getPresignedShareUrl({ bucket, key });

    expect(result).toEqual(mockedUrl);

    const getSignedUrlArgs = getSignedUrlSpy.mock.calls[0];
    expect(getSignedUrlArgs[1]).toBeInstanceOf(GetObjectCommand);
    expect(getSignedUrlArgs[1].input).toEqual({
      Bucket: bucket,
      Key: key,
    });
  });
});

describe('getPresignedUploadUrl', () => {
  it('should return presigned putObject url', async () => {
    const mockedUrl = 'http://mocked.example.com/path';
    const getSignedUrlSpy = jest
      .spyOn(requestPresigner, 'getSignedUrl')
      .mockResolvedValue(mockedUrl);

    const bucket = 'sample-bucket';
    const key = 'sample-key';
    const fileSizeBytes = 1;

    const result = await getPresignedUploadUrl({ bucket, key, fileSizeBytes });

    expect(result).toEqual(mockedUrl);

    const getSignedUrlArgs = getSignedUrlSpy.mock.calls[0];
    expect(getSignedUrlArgs[1]).toBeInstanceOf(PutObjectCommand);
    expect(getSignedUrlArgs[1].input).toEqual({
      Bucket: bucket,
      Key: key,
      ContentLength: fileSizeBytes,
    });
  });
});
