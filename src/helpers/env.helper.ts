export function getEnvVariableOrFail(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error('envHelper.getEnvVariableOrFail.missing');
  }

  return value;
}

export function isLocal() {
  return process.env.IS_LOCAL === 'true';
}
