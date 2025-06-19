// src/utils/conversationStorage.ts

// A generic message structure for storage to accommodate both types of conversations
export interface StoredMessage {
  id: string;
  // conversationId is the key under which this message array is stored in the main object
  // For multi-agent, it's the tab's conversationId.
  // For single-card, it could be `${cardId}_${conversationType}`.
  content: string;
  senderType: 'user' | 'agent' | 'assistant'; // 'assistant' from CardConversations, 'agent' from MultiAgent
  timestamp: string; // Store as ISO string for easy Date conversion

  // Fields specific to MultiAgentMessage
  agentCardId?: string; // The ID of the card if senderType is 'agent'

  // Fields specific to single-card ConversationMessage (useCardConversations)
  // card_id could be inferred from the conversationId structure for single-card chats
  // conversation_type could also be inferred for single-card chats
}

const LOCAL_STORAGE_KEY = 'app_conversation_history';

// The top-level structure in localStorage will be an object where keys are conversationIds
// and values are arrays of StoredMessage.
type AllConversationsStore = Record<string, StoredMessage[]>;

// Helper to get all conversations from Local Storage
function getAllStoredConversations(): AllConversationsStore {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as AllConversationsStore;
    }
    return {};
  } catch (error) {
    console.error("Error reading conversations from localStorage:", error);
    // Return empty object or consider re-throwing / specific error handling
    return {};
  }
}

// Helper to save all conversations to Local Storage
function saveAllStoredConversations(conversations: AllConversationsStore): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversations to localStorage:", error);
    // Consider how to handle storage being full, etc.
  }
}

export async function getMessagesForConversation(conversationId: string): Promise<StoredMessage[]> {
  const allConversations = getAllStoredConversations();
  return allConversations[conversationId] || [];
}

export async function addMessageToConversation(conversationId: string, message: StoredMessage): Promise<void> {
  const allConversations = getAllStoredConversations();
  if (!allConversations[conversationId]) {
    allConversations[conversationId] = [];
  }

  // Avoid duplicate messages by ID if this function might be called multiple times with the same message
  const messageExists = allConversations[conversationId].some(m => m.id === message.id);
  if (!messageExists) {
    allConversations[conversationId].push(message);
    // Sort messages by timestamp after adding, ensuring order
    allConversations[conversationId].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    saveAllStoredConversations(allConversations);
  }
}

export async function clearConversationHistory(conversationId: string): Promise<void> {
  const allConversations = getAllStoredConversations();
  if (allConversations[conversationId]) {
    delete allConversations[conversationId];
    saveAllStoredConversations(allConversations);
  }
}

export async function clearAllConversations(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing all conversation history from localStorage:", error);
  }
}
