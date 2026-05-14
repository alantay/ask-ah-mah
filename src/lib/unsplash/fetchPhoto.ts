const UNSPLASH_API = "https://api.unsplash.com";
const FALLBACK_QUERY = "food cooking";

export interface UnsplashPhoto {
  url: string;
  photographerName: string;
  photographerUrl: string;
}

async function search(query: string): Promise<UnsplashPhoto | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return null;

  const params = new URLSearchParams({
    query,
    orientation: "landscape",
    per_page: "1",
  });

  const res = await fetch(`${UNSPLASH_API}/search/photos?${params}`, {
    headers: { Authorization: `Client-ID ${accessKey}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const data = await res.json();
  const photo = data?.results?.[0];
  if (!photo) return null;

  return {
    url: photo.urls.regular,
    photographerName: photo.user.name,
    photographerUrl: `${photo.user.links.html}?utm_source=ask_ah_mah&utm_medium=referral`,
  };
}

export async function fetchRecipePhoto(
  tags: string[],
): Promise<UnsplashPhoto | null> {
  try {
    const query =
      tags.length > 0 ? tags.slice(0, 3).join(" ") : FALLBACK_QUERY;
    const result = await search(query);
    if (result) return result;

    // Retry with fallback if tag query returned no results
    if (query !== FALLBACK_QUERY) {
      return await search(FALLBACK_QUERY);
    }
    return null;
  } catch {
    return null;
  }
}
