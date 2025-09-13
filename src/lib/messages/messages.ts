import { prisma } from "@/lib/db";

export async function getMessages(userId: string) {
  const messages = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return messages;
}

export async function createMessage(
  userId: string,
  content: string,
  role: string
) {
  const message = await prisma.message.create({
    data: { userId, content, role },
  });

  return message;
}
