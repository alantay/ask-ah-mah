export function generateShortId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export const fetcher = async (...args: Parameters<typeof fetch>) => {
  console.log("Fetcher called with:", args[0]);
  const response = await fetch(...args);
  const data = await response.json();
  console.log("Fetcher response:", data);
  return data;
};
