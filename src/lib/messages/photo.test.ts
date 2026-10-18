import { TEST_PHOTO } from "@/lib/messages/photo.fixture";
import { MAX_PHOTO_BYTES, MAX_PHOTO_EDGE, photoBase64, PHOTO_PREFIX, PhotoSchema } from "./photo";

const jpeg = TEST_PHOTO;

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

it.each(["width", "height"])("rejects a small JPEG whose %s exceeds the dimension limit", (edge) => {
  const bytes = Buffer.from(photoBase64(TEST_PHOTO), "base64");
  const frame = bytes.indexOf(Buffer.from([0xff, 0xc0]));
  expect(frame).toBeGreaterThan(0);
  bytes.writeUInt16BE(MAX_PHOTO_EDGE + 1, frame + (edge === "height" ? 5 : 7));
  expect(PhotoSchema.safeParse(PHOTO_PREFIX + bytes.toString("base64")).success).toBe(false);
});

it.each(["/9j/2Q==", "!!!!", "/9j/wAAR"])("rejects invalid or missing JPEG frame data: %s", (data) => {
  expect(PhotoSchema.safeParse(PHOTO_PREFIX + data).success).toBe(false);
});
