export function createHash(text: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash;
  }
  return hash.toString(16); // Convert to hexadecimal
} 