export function getEnvVariableOrFail(name: keyof NodeJS.ProcessEnv) {
  const value = process.env[name];

  if (!value) {
    throw new Error('envHelper.getEnvVariableOrFail.missing');
  }

  return value;
}

export function isLocal() {
  return process.env.IS_LOCAL === 'true';
}
