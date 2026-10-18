import { getMessagePhoto } from "@/lib/messages";
import { withAuthDynamic } from "@/lib/withAuth";

export const GET = withAuthDynamic<{ id: string }>(async (_req, { userId, params }) => {
  const { id } = await params;
  const photo = await getMessagePhoto(id, userId);
  if (!photo) return new Response(null, { status: 404 });
  return new Response(Buffer.from(photo.slice(23), "base64"), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
