export interface SavedMessage {
  id: string;
  role: "user" | "assistant";
  userId: string;
  conversationId: string;
  createdAt: string;
  content: string;
}

export interface SaveMessageRequest {
  userId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}
