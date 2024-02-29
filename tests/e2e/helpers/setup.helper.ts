export function getE2eBaseUrl() {
  return process.env.E2E_BASE_URL ?? 'http://localhost:3000';
}
