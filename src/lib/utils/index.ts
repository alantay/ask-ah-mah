export function generateShortId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export const fetcher = async (...args: Parameters<typeof fetch>) => {
  const response = await fetch(...args);
  const data = await response.json();
  return data;
};
