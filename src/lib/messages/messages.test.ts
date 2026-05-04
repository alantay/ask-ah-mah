import { prisma } from "@/lib/db";
import { createMessage, getMessages } from "./messages";

// Mock Prisma
jest.mock("@/lib/db", () => ({
  prisma: {
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const mockedPrisma = jest.mocked(prisma);

describe("Message Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getMessages", () => {
    it("should retrieve messages for a conversation in ascending order", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          conversationId: "conv-123",
          userId: "user-123",
          content: "Hello",
          role: "user",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
        },
        {
          id: "msg-2",
          conversationId: "conv-123",
          userId: "user-123",
          content: "Hi there!",
          role: "assistant",
          createdAt: new Date("2024-01-01T10:01:00.000Z"),
        },
      ];

      mockedPrisma.message.findMany.mockResolvedValue(mockMessages);

      const result = await getMessages("conv-123");

      expect(result).toEqual(mockMessages);
      expect(mockedPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: "conv-123" },
        orderBy: { createdAt: "asc" },
      });
      expect(mockedPrisma.message.findMany).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no messages found", async () => {
      mockedPrisma.message.findMany.mockResolvedValue([]);

      const result = await getMessages("conv-456");

      expect(result).toEqual([]);
      expect(mockedPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: "conv-456" },
        orderBy: { createdAt: "asc" },
      });
    });

    it("should handle database errors gracefully", async () => {
      const dbError = new Error("Database connection failed");
      mockedPrisma.message.findMany.mockRejectedValue(dbError);

      await expect(getMessages("conv-123")).rejects.toThrow(
        "Database connection failed"
      );
      expect(mockedPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: "conv-123" },
        orderBy: { createdAt: "asc" },
      });
    });

    it("should filter messages by conversationId correctly", async () => {
      const mockMessages = [
        {
          id: "msg-1",
          conversationId: "conv-123",
          userId: "user-123",
          content: "Conv 123 message",
          role: "user",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
        },
      ];

      mockedPrisma.message.findMany.mockResolvedValue(mockMessages);

      await getMessages("conv-123");

      expect(mockedPrisma.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: "conv-123" },
        orderBy: { createdAt: "asc" },
      });

      // Verify it doesn't get called with different conversationId
      expect(mockedPrisma.message.findMany).not.toHaveBeenCalledWith({
        where: { conversationId: "conv-456" },
        orderBy: { createdAt: "asc" },
      });
    });
  });

  describe("createMessage", () => {
    it("should create a user message successfully", async () => {
      const newMessage = {
        id: "msg-new",
        conversationId: "conv-123",
        userId: "user-123",
        content: "What can I cook?",
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedPrisma.message.create.mockResolvedValue(newMessage);

      const result = await createMessage(
        "conv-123",
        "user-123",
        "What can I cook?",
        "user"
      );

      expect(result).toEqual(newMessage);
      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          userId: "user-123",
          content: "What can I cook?",
          role: "user",
        },
      });
      expect(mockedPrisma.message.create).toHaveBeenCalledTimes(1);
    });

    it("should create an assistant message successfully", async () => {
      const assistantMessage = {
        id: "msg-assist",
        conversationId: "conv-123",
        userId: "user-123",
        content: "You can make scrambled eggs!",
        role: "assistant",
        createdAt: new Date("2024-01-01T10:01:00.000Z"),
      };

      mockedPrisma.message.create.mockResolvedValue(assistantMessage);

      const result = await createMessage(
        "conv-123",
        "user-123",
        "You can make scrambled eggs!",
        "assistant"
      );

      expect(result).toEqual(assistantMessage);
      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          userId: "user-123",
          content: "You can make scrambled eggs!",
          role: "assistant",
        },
      });
    });

    it("should handle empty content", async () => {
      const emptyMessage = {
        id: "msg-empty",
        conversationId: "conv-123",
        userId: "user-123",
        content: "",
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedPrisma.message.create.mockResolvedValue(emptyMessage);

      const result = await createMessage("conv-123", "user-123", "", "user");

      expect(result).toEqual(emptyMessage);
      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          userId: "user-123",
          content: "",
          role: "user",
        },
      });
    });

    it("should handle long content", async () => {
      const longContent = "A".repeat(1000);
      const longMessage = {
        id: "msg-long",
        conversationId: "conv-123",
        userId: "user-123",
        content: longContent,
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedPrisma.message.create.mockResolvedValue(longMessage);

      const result = await createMessage("conv-123", "user-123", longContent, "user");

      expect(result).toEqual(longMessage);
      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          userId: "user-123",
          content: longContent,
          role: "user",
        },
      });
    });

    it("should handle special characters in content", async () => {
      const specialContent = "What's for 🍳 dinner? I have £10 & 2kg of 🥔!";
      const specialMessage = {
        id: "msg-special",
        conversationId: "conv-123",
        userId: "user-123",
        content: specialContent,
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedPrisma.message.create.mockResolvedValue(specialMessage);

      const result = await createMessage("conv-123", "user-123", specialContent, "user");

      expect(result).toEqual(specialMessage);
      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          userId: "user-123",
          content: specialContent,
          role: "user",
        },
      });
    });

    it("should handle database errors during creation", async () => {
      const dbError = new Error("Failed to create message");
      mockedPrisma.message.create.mockRejectedValue(dbError);

      await expect(
        createMessage("conv-123", "user-123", "Test message", "user")
      ).rejects.toThrow("Failed to create message");

      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          userId: "user-123",
          content: "Test message",
          role: "user",
        },
      });
    });

    it("should handle different role types", async () => {
      const systemMessage = {
        id: "msg-system",
        conversationId: "conv-123",
        userId: "user-123",
        content: "System initialized",
        role: "system",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedPrisma.message.create.mockResolvedValue(systemMessage);

      const result = await createMessage(
        "conv-123",
        "user-123",
        "System initialized",
        "system"
      );

      expect(result).toEqual(systemMessage);
      expect(mockedPrisma.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conv-123",
          userId: "user-123",
          content: "System initialized",
          role: "system",
        },
      });
    });
  });

  describe("Integration scenarios", () => {
    it("should handle typical conversation flow", async () => {
      const userMessage = {
        id: "msg-1",
        conversationId: "conv-123",
        userId: "user-123",
        content: "What can I cook?",
        role: "user",
        createdAt: new Date("2024-01-01T10:00:00.000Z"),
      };

      mockedPrisma.message.create.mockResolvedValueOnce(userMessage);

      const createdUserMessage = await createMessage(
        "conv-123",
        "user-123",
        "What can I cook?",
        "user"
      );
      expect(createdUserMessage).toEqual(userMessage);

      const assistantMessage = {
        id: "msg-2",
        conversationId: "conv-123",
        userId: "user-123",
        content: "You can make scrambled eggs!",
        role: "assistant",
        createdAt: new Date("2024-01-01T10:01:00.000Z"),
      };

      mockedPrisma.message.create.mockResolvedValueOnce(assistantMessage);

      const createdAssistantMessage = await createMessage(
        "conv-123",
        "user-123",
        "You can make scrambled eggs!",
        "assistant"
      );
      expect(createdAssistantMessage).toEqual(assistantMessage);

      const allMessages = [userMessage, assistantMessage];
      mockedPrisma.message.findMany.mockResolvedValue(allMessages);

      const retrievedMessages = await getMessages("conv-123");
      expect(retrievedMessages).toEqual(allMessages);
      expect(retrievedMessages).toHaveLength(2);
    });
  });
});
