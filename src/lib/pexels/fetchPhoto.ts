const PEXELS_API = "https://api.pexels.com/v1";
const FALLBACK_QUERY = "food cooking";

export interface PexelsPhoto {
  url: string;
  photographerName: string;
  photographerUrl: string;
}

async function search(query: string): Promise<PexelsPhoto | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    query,
    orientation: "landscape",
    per_page: "1",
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  const res = await fetch(`${PEXELS_API}/search?${params}`, {
    headers: { Authorization: apiKey },
    next: { revalidate: 0 },
    signal: controller.signal,
  });
  clearTimeout(timeout);

  if (!res.ok) return null;

  const data = await res.json();
  const photo = data?.photos?.[0];
  if (!photo) return null;

  return {
    url: photo.src.landscape,
    photographerName: photo.photographer,
    photographerUrl: photo.photographer_url,
  };
}

export async function fetchRecipePhoto(
  title: string,
  tags: string[] = [],
): Promise<PexelsPhoto | null> {
  try {
    const trimmedTitle = title.trim();
    const query =
      trimmedTitle ||
      (tags.length > 0 ? tags.slice(0, 3).join(" ") : FALLBACK_QUERY);
    const result = await search(query);
    if (result) return result;

    if (query !== FALLBACK_QUERY) {
      return await search(FALLBACK_QUERY);
    }
    return null;
  } catch {
    return null;
  }
}
