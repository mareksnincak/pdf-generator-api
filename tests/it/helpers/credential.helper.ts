export function mockAwsCredentials() {
  process.env.AWS_SECRET_ACCESS_KEY = 'XXXXXXXX';
  process.env.AWS_ACCESS_KEY_ID = 'XXXXXXXX';
}
