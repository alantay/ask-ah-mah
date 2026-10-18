import { z } from "zod";

export const MAX_PHOTO_BYTES = 512 * 1024;
export const MAX_PHOTO_EDGE = 1280;

// Only inline JPEGs are accepted: no remote URLs for the server to fetch.
export const PhotoSchema = z.string()
  .max(23 + 4 * Math.ceil(MAX_PHOTO_BYTES / 3))
  .regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/)
  .refine((url) => {
    const data = url.slice(23);
    const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
    return data.length % 4 === 0 && data.length * 3 / 4 - padding <= MAX_PHOTO_BYTES;
  });

export function photoPart(url: string) {
  return { type: "file" as const, mediaType: "image/jpeg", filename: "photo.jpg", url };
}
