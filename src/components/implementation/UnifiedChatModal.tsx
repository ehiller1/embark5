import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ImplementationCard, CardConnection } from '@/types/ImplementationTypes';

export interface ConversationSummary {
  id: string;
  title: string;
  participantCardIds: string[];
}

interface UnifiedChatModalProps {
  open: boolean;
  selectedNodeIds: string[];
  allCards: ImplementationCard[];
  connections: CardConnection[];
  existingConversations: ConversationSummary[];
  onClose: () => void;
  onSubmit: (
    selectedNodeIds: string[],
    chatMode: 'new' | 'existing',
    conversationId?: string
  ) => void;
}

export function UnifiedChatModal({
  open,
  selectedNodeIds: initialSelectedNodeIds,
  allCards,
  connections, // Added connections
  existingConversations,
  onClose,
  onSubmit,
}: UnifiedChatModalProps) {
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(initialSelectedNodeIds);
  const [chatMode, setChatMode] = useState<'new' | 'existing'>('new');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const displayableCards = React.useMemo(() => {
    if (chatMode === 'new' && initialSelectedNodeIds.length === 1) {
      const primaryNodeId = initialSelectedNodeIds[0];
      const connectedNodeIds = new Set<string>();
      connectedNodeIds.add(primaryNodeId);

      connections.forEach(conn => {
        if (conn.source_card_id === primaryNodeId) {
          connectedNodeIds.add(conn.target_card_id);
        }
        if (conn.target_card_id === primaryNodeId) {
          connectedNodeIds.add(conn.source_card_id);
        }
      });

      return allCards.filter(card => connectedNodeIds.has(card.id));
    }
    return allCards;
  }, [allCards, connections, initialSelectedNodeIds, chatMode]);

  // Keep selectedNodeIds in sync with prop changes
  React.useEffect(() => {
    setSelectedNodeIds(initialSelectedNodeIds);
  }, [initialSelectedNodeIds]);

  const handleToggleNode = (id: string) => {
    setSelectedNodeIds((prev) =>
      prev.includes(id) ? prev.filter((nid) => nid !== id) : [...prev, id]
    );
  };

  const handleSubmit = () => {
    onSubmit(selectedNodeIds, chatMode, chatMode === 'existing' ? selectedConversationId || undefined : undefined);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start or Add to Chat</DialogTitle>
        </DialogHeader>
        <div className="mb-3">
          <div className="font-semibold mb-1">Select Nodes:</div>
          <div className="flex flex-wrap gap-2">
            {displayableCards.map((card) => (
              <label key={card.id} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedNodeIds.includes(card.id)}
                  onChange={() => handleToggleNode(card.id)}
                />
                <span>{card.name}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mb-3">
          <label className="font-semibold mr-4">Chat Mode:</label>
          <label className="mr-2">
            <input
              type="radio"
              name="chatMode"
              value="new"
              checked={chatMode === 'new'}
              onChange={() => setChatMode('new')}
            />
            <span className="ml-1">Start New Chat</span>
          </label>
          <label>
            <input
              type="radio"
              name="chatMode"
              value="existing"
              checked={chatMode === 'existing'}
              onChange={() => setChatMode('existing')}
            />
            <span className="ml-1">Add to Existing Chat</span>
          </label>
          {chatMode === 'existing' && (
            <div className="mt-2">
              <select
                value={selectedConversationId || ''}
                onChange={(e) => setSelectedConversationId(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="" disabled>Select a conversation...</option>
                {existingConversations.map((conv) => (
                  <option key={conv.id} value={conv.id}>
                    {conv.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={handleSubmit} disabled={selectedNodeIds.length === 0 || (chatMode === 'existing' && !selectedConversationId)}>
            {chatMode === 'new' ? 'Start Chat' : 'Add to Chat'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
