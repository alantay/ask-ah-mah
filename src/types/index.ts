// Data types for Ask Ah Mah cooking assistant
// MVP: Focus on inventory management only

export interface InventoryItem {
  id: string;
  name: string;
  type: "ingredient" | "kitchenware";
  quantity?: number;
  unit?: string;
  dateAdded: Date;
  lastUpdated: Date;
}

// Chat and AI related types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface InventoryAction {
  type: "add" | "remove" | "update";
  item: Partial<InventoryItem>;
}
