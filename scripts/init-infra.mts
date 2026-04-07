import {
  CreateTableCommand,
  DynamoDBClient,
  ResourceInUseException,
} from '@aws-sdk/client-dynamodb';
import { BucketAlreadyOwnedByYou, CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { CreateQueueCommand, QueueNameExists, SQSClient } from '@aws-sdk/client-sqs';
import { ParameterAlreadyExists, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const FLOCI_ENDPOINT = 'http://localhost:4566';
const REGION = 'eu-central-1';
const CREDENTIALS = { accessKeyId: 'local', secretAccessKey: 'local' };

const dynamodb = new DynamoDBClient({ endpoint: 'http://localhost:8000', region: 'local' });
const s3 = new S3Client({
  credentials: CREDENTIALS,
  endpoint: FLOCI_ENDPOINT,
  forcePathStyle: true,
  region: REGION,
});
const sqs = new SQSClient({ credentials: CREDENTIALS, endpoint: FLOCI_ENDPOINT, region: REGION });
const ssm = new SSMClient({ credentials: CREDENTIALS, endpoint: FLOCI_ENDPOINT, region: REGION });

async function createTable() {
  try {
    await dynamodb.send(
      new CreateTableCommand({
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
          { AttributeName: 'GSI1PK', AttributeType: 'S' },
          { AttributeName: 'GSI1SK', AttributeType: 'S' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'GSI1PK', KeyType: 'HASH' },
              { AttributeName: 'GSI1SK', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          },
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' },
        ],
        TableName: 'PdfGenerator',
      }),
    );
    console.log('dynamodb table created: PdfGenerator');
  } catch (error) {
    if (error instanceof ResourceInUseException) {
      console.log('dynamodb table already exists: PdfGenerator');
      return;
    }
    throw error;
  }
}

async function createBucket(name: string) {
  try {
    await s3.send(new CreateBucketCommand({ Bucket: name }));
    console.log(`s3 bucket created: ${name}`);
  } catch (error) {
    if (error instanceof BucketAlreadyOwnedByYou) {
      console.log(`s3 bucket already exists: ${name}`);
      return;
    }
    throw error;
  }
}

async function createQueue(name: string) {
  try {
    const result = await sqs.send(new CreateQueueCommand({ QueueName: name }));
    console.log(`sqs queue created: ${result.QueueUrl}`);
  } catch (error) {
    if (error instanceof QueueNameExists) {
      console.log(`sqs queue already exists: ${name}`);
      return;
    }
    throw error;
  }
}

async function createOpenApiSsmParam() {
  const name = 'pdf-generator-api-local-open-api-params';
  const value = JSON.stringify({
    apiUrl: 'http://localhost:3000',
    authUrl: 'http://localhost:3000/oauth2/authorize',
  });
  try {
    await ssm.send(new PutParameterCommand({ Name: name, Type: 'String', Value: value }));
    console.log(`ssm parameter created: ${name}`);
  } catch (error) {
    if (error instanceof ParameterAlreadyExists) {
      console.log(`ssm parameter already exists: ${name}`);
      return;
    }
    throw error;
  }
}

await Promise.all([
  createTable(),
  createBucket('pdf-generator-api-local'),
  createQueue('pdf-generator-api-local-dead-letter-queue'),
  createQueue('pdf-generator-api-local-delete-expired-s3-objects-queue'),
  createOpenApiSsmParam(),
]);
