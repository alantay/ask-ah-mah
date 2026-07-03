import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export type ConversationEntity = {
  id: string;
  userId: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessageSnippet?: string | null;
  _count?: { messages: number };
};

export async function listConversations(
  userId: string
): Promise<ConversationEntity[]> {
  const rows = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { content: true } },
    },
  });

  return rows.map(({ messages, ...conv }) => ({
    ...conv,
    lastMessageSnippet: messages[0]?.content?.slice(0, 80) ?? null,
  }));
}

export async function getOrCreateActiveConversation(
  userId: string
): Promise<ConversationEntity> {
  const existing = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { messages: true } } },
  });

  if (existing) {
    return existing;
  }

  return createConversation(userId);
}

export async function getOrCreateEmptyConversation(
  userId: string
): Promise<ConversationEntity> {
  const existing = await prisma.conversation.findFirst({
    where: {
      userId,
      title: null,
      messages: { none: {} },
    },
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
  title: string,
  userId: string
): Promise<ConversationEntity> {
  // Ownership-scope the write: updateMany lets us filter on userId. A rename
  // aimed at another user's conversation matches zero rows and 404s.
  const result = await prisma.conversation.updateMany({
    where: { id, userId },
    data: { title },
  });

  if (result.count === 0) {
    throw new NotFoundError("Conversation");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: { _count: { select: { messages: true } } },
  });

  return conversation as ConversationEntity;
}

export async function autoTitleIfNull(
  id: string,
  title: string,
  userId: string
): Promise<ConversationEntity | null> {
  // Scope the write itself to { id, userId, title: null } so it stays atomic:
  // a concurrent rename or auto-title can't be clobbered between a separate
  // check and write, and a foreign id matches zero rows.
  const result = await prisma.conversation.updateMany({
    where: { id, userId, title: null },
    data: { title },
  });
  if (result.count === 0) return null;

  return prisma.conversation.findFirst({
    where: { id, userId },
    include: { _count: { select: { messages: true } } },
  });
}

export async function deleteConversation(
  id: string,
  userId: string
): Promise<void> {
  const result = await prisma.conversation.deleteMany({
    where: { id, userId },
  });

  if (result.count === 0) {
    throw new NotFoundError("Conversation");
  }
}

export async function maybeAutoTitleConversation(conversationId: string): Promise<void> {
  const count = await prisma.message.count({ where: { conversationId } });
  if (count !== 2) return;
  autoTitleConversation(conversationId).catch(() => {});
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
    model: openai("gpt-5-mini"),
    schema: z.object({ title: z.string().max(40) }),
    prompt: `Give this cooking chat session a short, warm title (3-6 words, no quotes, no punctuation at end).
User: "${firstUserMessage.content}"
Ah Mah: "${firstAssistantMessage.content}"`,
  });

  await prisma.conversation.update({ where: { id }, data: { title: object.title } });
}
