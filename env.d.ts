declare global {
  namespace NodeJS {
    type ProcessEnv = {
      LOG_LEVEL?: string;
      IS_LOCAL?: string;
      DYNAMODB_ENDPOINT?: string;
      DYNAMODB_TABLE_NAME?: string;
      S3_BUCKET?: string;
      KMS_KEY_ID?: string;
      PRESIGNED_URL_EXPIRATION_SECONDS?: string;
      DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL?: string;
      OPEN_API_SSM_PARAM_NAME?: string;
      STATE_MACHINE_ARN?: string;
      AWS_ACCESS_KEY_ID?: string;
      AWS_SECRET_ACCESS_KEY?: string;
      CHROMIUM_LOCAL_EXECUTABLE_PATH?: string;
      DYNAMODB_REGION?: string;
    };
  }
}

export {};
