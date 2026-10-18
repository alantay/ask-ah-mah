import { MAX_PHOTO_BYTES, PhotoSchema } from "./photo";

const jpeg = "data:image/jpeg;base64,/9j/2Q==";

it("accepts bounded inline JPEGs and rejects URLs, other media and invalid base64", () => {
  expect(PhotoSchema.safeParse(jpeg).success).toBe(true);
  for (const photo of ["https://example.com/photo.jpg", "data:image/svg+xml;base64,/9j/2Q==", "data:image/jpeg;base64,/9j/!"]) {
    expect(PhotoSchema.safeParse(photo).success).toBe(false);
  }
});

it("rejects photos larger than the byte limit", () => {
  const bytes = Buffer.alloc(MAX_PHOTO_BYTES + 1);
  bytes.set([0xff, 0xd8, 0xff]);
  expect(PhotoSchema.safeParse(`data:image/jpeg;base64,${bytes.toString("base64")}`).success).toBe(false);
});
