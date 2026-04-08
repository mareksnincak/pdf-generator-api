declare namespace NodeJS {
  type ProcessEnv = {
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AWS_XRAY_DAEMON_ADDRESS?: string;
    CHROMIUM_LOCAL_EXECUTABLE_PATH?: string;
    DELETE_EXPIRED_S3_OBJECTS_QUEUE_URL?: string;
    DELETE_UPLOADED_OBJECT_IN_SECONDS?: string;
    DOCUMENT_BATCH_TTL_HOURS?: string;
    DYNAMODB_ENDPOINT?: string;
    DYNAMODB_REGION?: string;
    DYNAMODB_TABLE_NAME?: string;
    IS_LOCAL?: string;
    KMS_ENDPOINT?: string;
    KMS_KEY_ID?: string;
    LOG_LEVEL?: string;
    OPEN_API_SSM_PARAM_NAME?: string;
    PRESIGNED_URL_EXPIRATION_SECONDS?: string;
    S3_BUCKET?: string;
    S3_ENDPOINT?: string;
    S3_PRESIGNED_URL_ENDPOINT?: string;
    SECRETS_MANAGER_ENDPOINT?: string;
    SENTRY_DSN?: string;
    SQS_ENDPOINT?: string;
    SSM_ENDPOINT?: string;
    STATE_MACHINE_ARN?: string;
  };
}
