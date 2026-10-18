import { MAX_PHOTO_BYTES, MAX_PHOTO_EDGE } from "@/lib/messages/photo";

/** Re-encode phone photos to a bounded JPEG, stripping metadata as well. */
export async function preparePhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG or WebP photo.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("That photo is too large. Choose one under 20 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't prepare this photo. Try another one.");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.8, 0.6, 0.4]) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const bytes = atob(dataUrl.split(",")[1]).length;
      if (bytes <= MAX_PHOTO_BYTES) return dataUrl;
    }
    throw new Error("Couldn't make this photo small enough. Try a closer crop.");
  } catch (error) {
    if (error instanceof DOMException) {
      throw new Error("Couldn't open this photo. Try a JPEG, PNG or WebP image.");
    }
    throw error;
  } finally {
    URL.revokeObjectURL(url);
  }
}
