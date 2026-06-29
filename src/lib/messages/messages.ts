import { prisma } from "@/lib/db";

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
  // Guard against writing into a conversation owned by someone else. The
  // connectOrCreate below would otherwise attach to any existing id; reject a
  // foreign owner so a caller can't append to another user's thread.
  const existing = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { userId: true },
  });
  if (existing && existing.userId !== userId) {
    throw new Error("Conversation not found");
  }

  const message = await prisma.message.create({
    data: {
      conversation: {
        connectOrCreate: {
          where: { id: conversationId },
          create: { id: conversationId, userId },
        },
      },
      userId,
      content,
      role,
    },
  });

  return message;
}
