export interface SavedMessage {
  id: string;
  role: "user" | "assistant";
  userId: string;
  conversationId: string;
  createdAt: string;
  content: string;
  /** Owner-authenticated image URL in history responses; never inline photo bytes. */
  photo?: string | null;
}

export interface SaveMessageRequest {
  userId: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
}
