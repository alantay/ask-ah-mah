import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

/**
 * Read a conversation's messages — scoped to its owner. Filtering on the
 * conversation relation's `userId` means a caller asking for someone else's
 * `conversationId` simply gets an empty list, never another user's history.
 */
export async function getMessages(conversationId: string, userId: string) {
  const where = { conversationId, conversation: { userId } };
  const [messages, photos] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
      omit: { photo: true },
    }),
    prisma.message.findMany({
      where: { ...where, photo: { not: null } },
      select: { id: true },
    }),
  ]);
  const photoIds = new Set(photos.map((message) => message.id));

  return messages.map((message) => ({
    ...message,
    photo: photoIds.has(message.id) ? `/api/message/${encodeURIComponent(message.id)}/photo` : null,
  }));
}

/** Load binary photo payloads only for the messages retained in model context. */
export function getMessagePhotos(ids: string[], userId: string) {
  return prisma.message.findMany({
    where: { id: { in: ids }, conversation: { userId } },
    select: { id: true, photo: true },
  });
}

export async function getMessagePhoto(id: string, userId: string) {
  const message = await prisma.message.findFirst({
    where: { id, conversation: { userId } },
    select: { photo: true },
  });
  return message?.photo ?? null;
}

export async function createMessage(
  conversationId: string,
  userId: string,
  content: string,
  role: string,
  photo?: string
) {
  // Guard against writing into a conversation owned by someone else, atomically.
  // A separate pre-check + connectOrCreate could race: a foreign conversation
  // created between the two would silently get our message attached. Inside a
  // transaction we check ownership, create the conversation ourselves when it's
  // absent (a duplicate id then fails the unique constraint rather than
  // attaching), and write the message directly.
  return prisma.$transaction(async (tx) => {
    const existing = await tx.conversation.findUnique({
      where: { id: conversationId },
      select: { userId: true },
    });
    if (existing && existing.userId !== userId) {
      throw new NotFoundError("Conversation");
    }
    if (!existing) {
      await tx.conversation.create({
        data: { id: conversationId, userId },
      });
    }

    return tx.message.create({
      data: { conversationId, userId, content, role, photo },
    });
  });
}
