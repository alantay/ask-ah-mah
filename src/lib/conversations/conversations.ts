import { prisma } from "@/lib/db";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export type ConversationEntity = {
  id: string;
  userId: string;
  title: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count?: { messages: number };
};

export async function listConversations(
  userId: string,
  options?: { includeArchived?: boolean }
): Promise<ConversationEntity[]> {
  const includeArchived = options?.includeArchived ?? false;

  return prisma.conversation.findMany({
    where: {
      userId,
      ...(includeArchived ? {} : { archived: false }),
    },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });
}

export async function getOrCreateActiveConversation(
  userId: string
): Promise<ConversationEntity> {
  const existing = await prisma.conversation.findFirst({
    where: { userId, archived: false },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  if (existing) {
    return existing;
  }

  return createConversation(userId);
}

export async function createConversation(
  userId: string
): Promise<ConversationEntity> {
  const conversation = await prisma.conversation.create({
    data: { userId },
    include: { _count: { select: { messages: true } } },
  });

  return conversation;
}

export async function renameConversation(
  id: string,
  title: string
): Promise<ConversationEntity> {
  const conversation = await prisma.conversation.update({
    where: { id },
    data: { title },
    include: { _count: { select: { messages: true } } },
  });

  return conversation;
}

export async function autoTitleIfNull(
  id: string,
  title: string
): Promise<ConversationEntity | null> {
  const existing = await prisma.conversation.findUnique({ where: { id } });
  if (!existing || existing.title !== null) return null;
  return prisma.conversation.update({
    where: { id },
    data: { title },
    include: { _count: { select: { messages: true } } },
  });
}

export async function archiveConversation(
  id: string
): Promise<ConversationEntity> {
  const conversation = await prisma.conversation.update({
    where: { id },
    data: { archived: true },
    include: { _count: { select: { messages: true } } },
  });

  return conversation;
}

export async function autoTitleConversation(id: string): Promise<void> {
  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (messages.length < 2) {
    return;
  }

  const conversation = await prisma.conversation.findUnique({ where: { id } });
  if (conversation?.title) {
    return;
  }

  const firstUserMessage = messages.find((m) => m.role === "user");
  const firstAssistantMessage = messages.find((m) => m.role === "assistant");

  if (!firstUserMessage || !firstAssistantMessage) {
    return;
  }

  const { object } = await generateObject({
    model: openai("gpt-4.1-mini"),
    schema: z.object({ title: z.string().max(40) }),
    prompt: `Give this cooking chat session a short, warm title (3-6 words, no quotes, no punctuation at end).
User: "${firstUserMessage.content}"
Ah Mah: "${firstAssistantMessage.content}"`,
  });

  await prisma.conversation.update({ where: { id }, data: { title: object.title } });
}
