import { prisma } from "@/lib/db";
import {
  archiveConversation,
  autoTitleConversation,
  createConversation,
  getOrCreateActiveConversation,
  listConversations,
  renameConversation,
} from "./conversations";

jest.mock("@/lib/db", () => ({
  prisma: {
    conversation: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock("ai", () => ({
  generateObject: jest.fn(),
}));

jest.mock("@ai-sdk/openai", () => ({
  openai: jest.fn(() => "mock-model"),
}));

const mockedPrisma = jest.mocked(prisma);
import { generateObject } from "ai";
const mockedGenerateObject = jest.mocked(generateObject);

function makeConversation(overrides: Partial<{
  id: string;
  userId: string;
  title: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { messages: number };
}> = {}) {
  return {
    id: "conv-1",
    userId: "user-1",
    title: null,
    archived: false,
    createdAt: new Date("2024-01-01T10:00:00.000Z"),
    updatedAt: new Date("2024-01-01T10:00:00.000Z"),
    _count: { messages: 0 },
    ...overrides,
  };
}

describe("Conversation Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("listConversations", () => {
    it("groups conversations into today/yesterday/earlier", async () => {
      const now = new Date();
      const todayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12)
      );
      const yesterdayUTC = new Date(todayUTC.getTime() - 24 * 60 * 60 * 1000);
      const earlierDate = new Date(todayUTC.getTime() - 3 * 24 * 60 * 60 * 1000);

      const todayConv = makeConversation({ id: "conv-today", updatedAt: todayUTC });
      const yesterdayConv = makeConversation({ id: "conv-yesterday", updatedAt: yesterdayUTC });
      const earlierConv = makeConversation({ id: "conv-earlier", updatedAt: earlierDate });

      mockedPrisma.conversation.findMany.mockResolvedValue([
        todayConv,
        yesterdayConv,
        earlierConv,
      ]);

      const result = await listConversations("user-1");

      expect(result.today).toHaveLength(1);
      expect(result.today[0].id).toBe("conv-today");
      expect(result.yesterday).toHaveLength(1);
      expect(result.yesterday[0].id).toBe("conv-yesterday");
      expect(result.earlier).toHaveLength(1);
      expect(result.earlier[0].id).toBe("conv-earlier");
    });

    it("returns empty buckets when no conversations", async () => {
      mockedPrisma.conversation.findMany.mockResolvedValue([]);

      const result = await listConversations("user-1");

      expect(result.today).toHaveLength(0);
      expect(result.yesterday).toHaveLength(0);
      expect(result.earlier).toHaveLength(0);
    });

    it("excludes archived conversations by default", async () => {
      mockedPrisma.conversation.findMany.mockResolvedValue([]);

      await listConversations("user-1");

      expect(mockedPrisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ archived: false }),
        })
      );
    });

    it("includes archived conversations when includeArchived is true", async () => {
      mockedPrisma.conversation.findMany.mockResolvedValue([]);

      await listConversations("user-1", { includeArchived: true });

      expect(mockedPrisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
        })
      );
    });
  });

  describe("getOrCreateActiveConversation", () => {
    it("returns existing conversation if one exists", async () => {
      const existing = makeConversation({ id: "conv-existing" });
      mockedPrisma.conversation.findFirst.mockResolvedValue(existing);

      const result = await getOrCreateActiveConversation("user-1");

      expect(result.id).toBe("conv-existing");
      expect(mockedPrisma.conversation.create).not.toHaveBeenCalled();
    });

    it("creates a new conversation if none exists", async () => {
      const newConv = makeConversation({ id: "conv-new" });
      mockedPrisma.conversation.findFirst.mockResolvedValue(null);
      mockedPrisma.conversation.create.mockResolvedValue(newConv);

      const result = await getOrCreateActiveConversation("user-1");

      expect(result.id).toBe("conv-new");
      expect(mockedPrisma.conversation.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("createConversation", () => {
    it("creates and returns a new conversation", async () => {
      const newConv = makeConversation({ id: "conv-created", userId: "user-2" });
      mockedPrisma.conversation.create.mockResolvedValue(newConv);

      const result = await createConversation("user-2");

      expect(result.id).toBe("conv-created");
      expect(result.userId).toBe("user-2");
      expect(mockedPrisma.conversation.create).toHaveBeenCalledWith({
        data: { userId: "user-2" },
        include: { _count: { select: { messages: true } } },
      });
    });
  });

  describe("renameConversation", () => {
    it("updates title and returns updated conversation", async () => {
      const updated = makeConversation({ id: "conv-1", title: "My New Title" });
      mockedPrisma.conversation.update.mockResolvedValue(updated);

      const result = await renameConversation("conv-1", "My New Title");

      expect(result.title).toBe("My New Title");
      expect(mockedPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "conv-1" },
        data: { title: "My New Title" },
        include: { _count: { select: { messages: true } } },
      });
    });
  });

  describe("archiveConversation", () => {
    it("sets archived = true and returns updated conversation", async () => {
      const archived = makeConversation({ id: "conv-1", archived: true });
      mockedPrisma.conversation.update.mockResolvedValue(archived);

      const result = await archiveConversation("conv-1");

      expect(result.archived).toBe(true);
      expect(mockedPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "conv-1" },
        data: { archived: true },
        include: { _count: { select: { messages: true } } },
      });
    });
  });

  describe("autoTitleConversation", () => {
    it("is a no-op if fewer than 2 messages", async () => {
      mockedPrisma.message.findMany.mockResolvedValue([
        {
          id: "msg-1",
          conversationId: "conv-1",
          userId: "user-1",
          content: "Hello",
          role: "user",
          createdAt: new Date(),
        },
      ]);

      await autoTitleConversation("conv-1");

      expect(mockedGenerateObject).not.toHaveBeenCalled();
      expect(mockedPrisma.conversation.update).not.toHaveBeenCalled();
    });

    it("is a no-op if title is already set", async () => {
      mockedPrisma.message.findMany.mockResolvedValue([
        {
          id: "msg-1",
          conversationId: "conv-1",
          userId: "user-1",
          content: "What can I cook?",
          role: "user",
          createdAt: new Date(),
        },
        {
          id: "msg-2",
          conversationId: "conv-1",
          userId: "user-1",
          content: "You can make eggs!",
          role: "assistant",
          createdAt: new Date(),
        },
      ]);

      mockedPrisma.conversation.findUnique.mockResolvedValue(
        makeConversation({ title: "Existing Title" })
      );

      await autoTitleConversation("conv-1");

      expect(mockedGenerateObject).not.toHaveBeenCalled();
    });

    it("generates and saves a title when 2+ messages and no existing title", async () => {
      mockedPrisma.message.findMany.mockResolvedValue([
        {
          id: "msg-1",
          conversationId: "conv-1",
          userId: "user-1",
          content: "What can I cook with eggs?",
          role: "user",
          createdAt: new Date(),
        },
        {
          id: "msg-2",
          conversationId: "conv-1",
          userId: "user-1",
          content: "You can make scrambled eggs!",
          role: "assistant",
          createdAt: new Date(),
        },
      ]);

      mockedPrisma.conversation.findUnique.mockResolvedValue(
        makeConversation({ title: null })
      );

      mockedGenerateObject.mockResolvedValue({
        object: { title: "Cooking With Eggs" },
      } as ReturnType<typeof generateObject> extends Promise<infer T> ? T : never);

      mockedPrisma.conversation.update.mockResolvedValue(
        makeConversation({ title: "Cooking With Eggs" })
      );

      await autoTitleConversation("conv-1");

      expect(mockedGenerateObject).toHaveBeenCalledTimes(1);
      expect(mockedPrisma.conversation.update).toHaveBeenCalledWith({
        where: { id: "conv-1" },
        data: { title: "Cooking With Eggs" },
      });
    });
  });
});
