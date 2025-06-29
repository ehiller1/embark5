
import { useState, useEffect, useCallback } from 'react';
import { getMessagesForConversation, addMessageToConversation, StoredMessage } from '@/utils/conversationStorage';
import { useImplementationCards } from './useImplementationCards';
import { ConversationMessage, ImplementationCard } from '@/types/ImplementationTypes';
import { useToast } from './use-toast';
import { v4 as uuidv4 } from 'uuid';

export function useCardConversations(cardId: string, conversationType: 'interaction' | 'advisory') {
  const storageConversationId = `${cardId}_${conversationType}`;
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { cards } = useImplementationCards();
  const { toast } = useToast();
  
  // Find the card details
  const card = cards.find(c => c.id === cardId) || null;

  // Fetch messages for the card from Local Storage
  const fetchMessages = useCallback(async () => {
    if (!cardId) return;

    setIsLoading(true);
    try {
      const storedMessages = await getMessagesForConversation(storageConversationId);
      
      const formattedMessages: ConversationMessage[] = storedMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.senderType as 'user' | 'assistant', // Assuming StoredMessage.senderType aligns
        timestamp: new Date(msg.timestamp),
        card_id: cardId, // Derived from context
        conversation_type: conversationType // Derived from context
      }));
      
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages from localStorage:', error);
      toast({
        title: 'Error',
        description: 'Could not load conversation messages from local history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [cardId, conversationType, storageConversationId, toast]);

  // Send a message in the conversation
  const sendMessage = useCallback(async (content: string) => {
    if (!cardId || !content.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Add user message to UI immediately
      const userMessageId = uuidv4();
      const userMessage: ConversationMessage = {
        id: userMessageId,
        content,
        sender: 'user',
        timestamp: new Date(),
        card_id: cardId,
        conversation_type: conversationType
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Save user message to Local Storage
      const storedUserMessage: StoredMessage = {
        id: userMessageId, // Use the ID generated for the message
        content: content, // Use the original content string
        senderType: 'user',
        timestamp: new Date().toISOString(), // Use current timestamp, consistent with previous DB logic
        // No agentCardId for user messages in this context
      };
      await addMessageToConversation(storageConversationId, storedUserMessage);
      
      // Generate AI response based on card data and conversation type
      let responseContent = '';
      
      if (conversationType === 'interaction') {
        // Simulate the card responding directly
        responseContent = await generateCardResponse(card);
      } else {
        // Simulate advisor giving advice about interacting with the card
        responseContent = await generateAdvisoryResponse(card);
      }
      
      // Add AI response to UI
      const aiMessageId = uuidv4();
      const aiMessage: ConversationMessage = {
        id: aiMessageId,
        content: responseContent,
        sender: 'assistant',
        timestamp: new Date(),
        card_id: cardId,
        conversation_type: conversationType
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Save AI response to Local Storage
      const storedAiMessage: StoredMessage = {
        id: aiMessageId, // Use the ID generated for the message
        content: responseContent, // Use the original responseContent string
        senderType: 'assistant',
        timestamp: new Date().toISOString(), // Use current timestamp, consistent with previous DB logic
        // No agentCardId for AI assistant messages in this context
      };
      await addMessageToConversation(storageConversationId, storedAiMessage);
      
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Could not send message.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [cardId, conversationType, card, toast, storageConversationId]);
  
  // Load messages when component mounts or cardId/conversationType changes
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  
  return { messages, isLoading, sendMessage, card };
}

// Helper function to generate a response as if the card is speaking
async function generateCardResponse(card: ImplementationCard | null): Promise<string> {
  // In a real implementation, this would call an AI service
  // For now, we'll generate a simple response based on the card data
  
  if (!card) return "I'm not sure how to respond to that.";
  
  const responses = [
    `As ${card.name}, I think we should consider the impact on our congregation.`,
    `From my perspective as ${card.name}, I'm concerned about how this affects our resources.`,
    `I think what you're suggesting could work well, though we should consult with the other stakeholders.`,
    `As ${card.type === 'individual' ? 'someone who' : 'a group that'} ${card.description}, I appreciate your ideas.`,
    `I'd like to hear more about how this connects to our overall discernment process.`,
    `That's an interesting point. Have you considered how this would be received by the rest of the congregation?`,
    `I think we need to pray more about this decision before moving forward.`
  ];
  
  // Simulate thinking time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Helper function to generate advisory response about interacting with the card
async function generateAdvisoryResponse(card: ImplementationCard | null): Promise<string> {
  // In a real implementation, this would call an AI service
  // For now, we'll generate a simple response based on the card data
  
  if (!card) return "I can't provide advice without more information about who you're interacting with.";
  
  const responses = [
    `When talking to ${card.name}, remember that ${card.type === 'individual' ? 'they have' : 'this group has'} concerns about ${card.description}.`,
    `${card.name} might be receptive to your ideas if you frame them in terms of community benefit.`,
    `Consider acknowledging ${card.name}'s perspective before sharing your own thoughts.`,
    `With ${card.name}, it's important to listen carefully and validate their concerns.`,
    `I'd suggest preparing specific examples before meeting with ${card.name}.`,
    `For someone like ${card.name}, focusing on the spiritual aspects of your proposal might be effective.`,
    `When engaging with ${card.name}, try to connect your ideas to their values and priorities.`
  ];
  
  // Simulate thinking time
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return responses[Math.floor(Math.random() * responses.length)];
}
