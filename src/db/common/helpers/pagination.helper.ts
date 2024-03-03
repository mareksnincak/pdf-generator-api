import { type AttributeValue } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

// TODO encrypt
export function encodePaginationToken(
  lastEvaluatedKey: Record<string, AttributeValue> | undefined,
) {
  if (!lastEvaluatedKey) {
    return null;
  }

  return JSON.stringify(unmarshall(lastEvaluatedKey));
}

export function decodePaginationToken(paginationToken?: string) {
  if (!paginationToken) {
    return;
  }

  return marshall(JSON.parse(paginationToken));
}
