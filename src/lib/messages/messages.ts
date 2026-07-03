import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

/**
 * Read a conversation's messages — scoped to its owner. Filtering on the
 * conversation relation's `userId` means a caller asking for someone else's
 * `conversationId` simply gets an empty list, never another user's history.
 */
export async function getMessages(conversationId: string, userId: string) {
  const messages = await prisma.message.findMany({
    where: { conversationId, conversation: { userId } },
    orderBy: { createdAt: "asc" },
  });

  return messages;
}

export async function createMessage(
  conversationId: string,
  userId: string,
  content: string,
  role: string
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
      data: { conversationId, userId, content, role },
    });
  });
}
