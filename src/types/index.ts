// Re-export types from schemas (schema-first approach)
// This provides a clean import path for components

export type {
  ChatMessage,
  InventoryAction,
  InventoryItem,
} from "../lib/schemas";
