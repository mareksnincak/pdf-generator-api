import { randomUUID } from 'node:crypto';

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as requestPresigner from '@aws-sdk/s3-request-presigner';

import {
  copyObject,
  deleteObject,
  deleteObjects,
  getObject,
  getPresignedShareUrl,
  getPresignedUploadUrl,
  moveObject,
  putObject,
} from './s3.helper';
import { mockLogger } from './test.helper';

jest.mock('@aws-sdk/s3-request-presigner', () => {
  return {
    __esModule: true,
    ...jest.requireActual('@aws-sdk/s3-request-presigner'),
  };
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('getObject', () => {
  it('should return object', async () => {
    const data = randomUUID();
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation(() => ({
      Body: {
        transformToByteArray: () => data,
      },
    }));

    const bucket = 'sample-bucket';
    const key = 'sample-key';

    const result = await getObject({ bucket, key });

    expect(result.toString()).toEqual(data);

    const s3ClientArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3ClientArgs).toBeInstanceOf(GetObjectCommand);
    expect(s3ClientArgs.input).toEqual({
      Bucket: bucket,
      Key: key,
    });
  });
});

describe('putObject', () => {
  it('should upload object', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const bucket = 'sample-bucket';
    const key = 'sample-key';
    const data = Buffer.from(randomUUID());

    await putObject({ bucket, key, data });

    const s3ClientArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3ClientArgs).toBeInstanceOf(PutObjectCommand);
    expect(s3ClientArgs.input).toEqual({
      Bucket: bucket,
      Key: key,
      Body: data,
    });
  });
});

describe('deleteObject', () => {
  it('should delete object', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation();

    const bucket = 'sample-bucket';
    const key = 'sample-key';

    await deleteObject({ bucket, key });

    const s3ClientArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3ClientArgs).toBeInstanceOf(DeleteObjectCommand);
    expect(s3ClientArgs.input).toEqual({
      Bucket: bucket,
      Key: key,
    });
  });
});

describe('deleteObjects', () => {
  it('should delete objects', async () => {
    const s3ClientSpy = jest.spyOn(S3Client.prototype, 'send').mockImplementation(() => ({}));

    const bucket = 'sample-bucket';
    const keys = ['sample-key-1', 'sample-key-2'];

    await deleteObjects({ bucket, keys });

    const s3ClientArgs = s3ClientSpy.mock.calls[0]?.[0];
    expect(s3ClientArgs).toBeInstanceOf(DeleteObjectsCommand);
    expect(s3ClientArgs.input).toEqual({
      Bucket: bucket,
      Delete: {
        Objects: [
          {
            Key: keys[0],
          },
          {
            Key: keys[1],
          },
        ],
      },
    });
  });

  it('should throw error if there is some error in response', async () => {
    mockLogger();
    const bucket = 'sample-bucket';
    const keys = ['sample-key-1'];

    jest.spyOn(S3Client.prototype, 'send').mockImplementation(() => ({
      Errors: [
        {
          Key: keys[0],
        },
      ],
    }));

    try {
      await deleteObjects({ bucket, keys });
      expect(true).toEqual(false);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toEqual('s3Helper.deleteObjects.deletionErrors');
    }
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
