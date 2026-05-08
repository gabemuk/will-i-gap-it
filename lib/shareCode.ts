/**
 * Generates a short random alphanumeric share code for matchup URLs.
 * e.g. "a3k9xz2m"
 */
export function generateShareCode(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
