export type SetDefaultUserPasswordResourceCustomProperties = {
  physicalResourceId: string;
  userCredentialsSecretName: string;
  userPoolId: string;
};

export type SetDefaultUserPasswordResourceProperties = {
  ServiceToken: string;
} & SetDefaultUserPasswordResourceCustomProperties;
