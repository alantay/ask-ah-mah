export function generateShortId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export const fetcher = (...args: Parameters<typeof fetch>) =>
  fetch(...args).then((res) => res.json());
