import { readLimitedText } from "./http";

jest.mock("next/server", () => ({ NextResponse: { json: jest.fn() } }));

const request = (body: ReadableStream<Uint8Array> | null) => ({ body }) as Request;

it("decodes UTF-8 split across chunks at the exact byte limit", async () => {
  const bytes = Buffer.from("🍳");
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes.subarray(0, 2));
      controller.enqueue(bytes.subarray(2));
      controller.close();
    },
  });
  expect(await readLimitedText(request(body), 4)).toBe("🍳");
});

it("cancels an oversized stream instead of reading the remainder", async () => {
  const cancel = jest.fn();
  let chunks = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      chunks++;
      controller.enqueue(Buffer.alloc(4));
    },
    cancel,
  }, { highWaterMark: 0 });
  expect(await readLimitedText(request(body), 5)).toBeNull();
  expect(chunks).toBe(2);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(body.locked).toBe(false);
});

it("handles an empty request body", async () => {
  expect(await readLimitedText(request(null), 5)).toBe("");
});

it("releases the reader when the body stream fails", async () => {
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.error(new Error("Connection lost")); },
  });
  await expect(readLimitedText(request(body), 5)).rejects.toThrow("Connection lost");
  expect(body.locked).toBe(false);
});
