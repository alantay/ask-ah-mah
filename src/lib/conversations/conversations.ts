import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { MODEL_LIGHT } from "@/lib/ai/models";
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

export async function maybeAutoTitleConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  const count = await prisma.message.count({ where: { conversationId } });
  if (count !== 2) return;
  autoTitleConversation(conversationId, userId).catch(() => {});
}

/**
 * The prompt asks for no emoji, but a prompt is not a guarantee and the title is
 * persisted — an emoji that lands in the database costs a migration to remove
 * (ADR-0026). Strip rather than reject: this runs once, at exactly two messages,
 * and its caller swallows errors, so a rejected title would leave the
 * conversation permanently untitled.
 */
function stripEmoji(title: string): string {
  return title
    .replace(/\p{Extended_Pictographic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function autoTitleConversation(id: string, userId: string): Promise<void> {
  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 10,
  });

  if (messages.length < 2) {
    return;
  }

  const conversation = await prisma.conversation.findFirst({ where: { id, userId } });
  if (conversation?.title) {
    return;
  }

  const firstUserMessage = messages.find((m) => m.role === "user");
  const firstAssistantMessage = messages.find((m) => m.role === "assistant");

  if (!firstUserMessage || !firstAssistantMessage) {
    return;
  }

  const { object } = await generateObject({
    model: openai(MODEL_LIGHT),
    schema: z.object({ title: z.string().max(40) }),
    prompt: `Name this cooking chat by its dish or main ingredient, so it can be recognised in a list weeks later (3-6 words, no quotes, no punctuation at end). Lead with the dish. If no dish was settled on, name the ingredients discussed. No emoji.
User: "${firstUserMessage.content}"
Ah Mah: "${firstAssistantMessage.content}"`,
  });

  const title = stripEmoji(object.title);
  if (!title) return;

  // Same atomic guard as autoTitleIfNull, and load-bearing here because generation
  // takes seconds: a rename or an autoTitleIfNull recipe-title stamp can land while
  // we wait. Scoping the write to { title: null } means the late writer loses
  // instead of clobbering a title the user (or a recipe) already gave this row.
  await prisma.conversation.updateMany({
    where: { id, userId, title: null },
    data: { title },
  });
}
