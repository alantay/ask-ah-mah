export interface SavedMessage {
  id: string;
  role: "user" | "assistant";
  userId: string;
  createdAt: string;
  content: string;
}

export interface SaveMessageRequest {
  userId: string;
  role: "user" | "assistant";
  content: string;
}
