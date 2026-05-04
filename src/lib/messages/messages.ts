import { prisma } from "@/lib/db";

export async function getMessages(conversationId: string) {
  const messages = await prisma.message.findMany({
    where: { conversationId },
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
  const message = await prisma.message.create({
    data: { conversationId, userId, content, role },
  });

  return message;
}
