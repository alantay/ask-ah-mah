"use client";

import { useConversationContext } from "@/contexts/ConversationContext";
import { useActiveSection } from "@/hooks/useActiveSection";
import { ConversationItem } from "./components/ConversationItem";
import { ConversationListSkeleton } from "./components/ConversationListSkeleton";

interface ConversationsProps {
  onItemClick?: () => void;
}

export function Conversations({ onItemClick }: ConversationsProps) {
  const {
    activeConversationId,
    pendingConversationId,
    conversations: allConversations,
    conversationsLoading: isLoading,
    setActiveConversation,
    renameConversation,
    deleteConversation,
  } = useConversationContext();

  const isChatActive = useActiveSection() === "chat";

  const committedConversations = allConversations.filter(
    (c) => (c._count?.messages ?? 0) > 0 || c.id === pendingConversationId
  );

  const handleItemClick = (id: string) => {
    setActiveConversation(id);
    onItemClick?.();
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="font-display italic font-medium text-heading text-foreground">
        Conversations
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading && allConversations.length === 0 ? (
          <ConversationListSkeleton />
        ) : committedConversations.length === 0 ? (
          <div className="font-display italic text-ink-faint text-sm">No chats yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {committedConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={isChatActive && (conv.id === activeConversationId || conv.id === pendingConversationId)}
                onClick={() => handleItemClick(conv.id)}
                onRename={(newTitle) => renameConversation(conv.id, newTitle)}
                onDelete={() => deleteConversation(conv.id)}
                canDelete={(conv._count?.messages ?? 0) > 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
