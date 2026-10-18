import { z } from "zod";

export const MAX_PHOTO_BYTES = 512 * 1024;
export const MAX_PHOTO_EDGE = 1280;
export const PHOTO_PREFIX = "data:image/jpeg;base64,";
export const PHOTO_INPUT_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function photoBase64(url: string) {
  return url.slice(PHOTO_PREFIX.length);
}

// Read JPEG frame dimensions without decoding pixel data or loading a native
// image library. Frames must fit the same bounds as the composer output.
function hasBoundedJpegFrame(data: string) {
  let bytes: string;
  try {
    bytes = atob(data);
  } catch {
    return false;
  }
  const word = (offset: number) => bytes.charCodeAt(offset) * 256 + bytes.charCodeAt(offset + 1);
  let offset = 2; // SOI
  while (offset + 3 < bytes.length) {
    if (bytes.charCodeAt(offset++) !== 0xff) return false;
    while (bytes.charCodeAt(offset) === 0xff) offset++;
    const marker = bytes.charCodeAt(offset++);
    if (marker === 0xd9 || marker === 0xda) return false; // EOI / scan, before a frame
    const length = word(offset);
    if (length < 2 || offset + length > bytes.length) return false;
    // Baseline, extended and progressive DCT frames are emitted by supported browsers.
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      const height = word(offset + 3);
      const width = word(offset + 5);
      return length >= 8 && height > 0 && width > 0 && Math.max(height, width) <= MAX_PHOTO_EDGE;
    }
    offset += length;
  }
  return false;
}

// Only inline JPEGs are accepted: no remote URLs for the server to fetch.
export const PhotoSchema = z.string()
  .max(PHOTO_PREFIX.length + 4 * Math.ceil(MAX_PHOTO_BYTES / 3))
  .regex(/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/)
  .refine((url) => {
    const data = photoBase64(url);
    const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
    return data.length % 4 === 0 && data.length * 3 / 4 - padding <= MAX_PHOTO_BYTES && hasBoundedJpegFrame(data);
  });

export function photoPart(url: string) {
  return { type: "file" as const, mediaType: "image/jpeg", filename: "photo.jpg", url };
}

export function messageParts(text: string, photo?: string | null) {
  return [...(photo ? [photoPart(photo)] : []), { type: "text" as const, text }];
}

export function hasValidPhotoAttachment(message: { role: string; parts: unknown[] }) {
  const files = message.parts.filter((part) =>
    part && typeof part === "object" && "type" in part && part.type === "file"
  );
  if (files.length === 0) return true;
  if (message.role !== "user" || files.length !== 1) return false;
  const file = files[0] as { mediaType?: unknown; url?: unknown };
  return file.mediaType === "image/jpeg" && PhotoSchema.safeParse(file.url).success;
}
