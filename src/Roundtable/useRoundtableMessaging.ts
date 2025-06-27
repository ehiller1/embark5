
import { useState, useCallback } from 'react';
import { RoundtableMessage, createRoundtableMessage } from './roundtableUtils';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';

export function useRoundtableMessaging() {
  const [messages, setMessages] = useState<RoundtableMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const { selectedCompanion } = useSelectedCompanion();
  const { churchAvatars, communityAvatars } = useNarrativeAvatar(); // Use the available properties

  const addMessage = useCallback((messageData: Omit<RoundtableMessage, 'id' | 'timestamp'>) => {
    const newMessage = createRoundtableMessage(messageData);
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const sendRoundtableMessage = useCallback((content: string) => {
    if (!content.trim()) return;
    
    addMessage({
      role: 'user',
      content: content.trim(),
      name: 'You',
    });
    
    setIsProcessing(true);
    // In a real app, you would send this message to an API and get a response
    setTimeout(() => {
      // Use the first available church avatar, if present
      if (churchAvatars && churchAvatars.length > 0) {
        const churchAvatar = churchAvatars[0];
        addMessage({
          role: 'church',
          content: `From the church perspective, I'm considering "${content.trim()}"`,
          name: churchAvatar.name || 'Church Avatar',
          avatarUrl: churchAvatar.avatar_url || churchAvatar.image_url
        });
      }
      // Use the first available community avatar, if present
      if (communityAvatars && communityAvatars.length > 0) {
        const communityAvatar = communityAvatars[0];
        addMessage({
          role: 'community',
          content: `From the community perspective, I'm thinking about "${content.trim()}"`,
          name: communityAvatar.name || 'Community Avatar',
          avatarUrl: communityAvatar.avatar_url || communityAvatar.image_url
        });
      }
      if (selectedCompanion) {
        addMessage({
          role: 'companion',
          content: `As ${selectedCompanion.companion}, I'm considering your thoughts on "${content.trim()}"`,
          name: selectedCompanion.companion || 'Companion',
          avatarUrl: selectedCompanion.avatar_url
        });
      }
      setIsProcessing(false);
    }, 1000);
  }, [addMessage, selectedCompanion, churchAvatars, communityAvatars]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    roundtableMessages: messages,
    isProcessing,
    addMessage,
    sendRoundtableMessage,
    clearMessages,
    currentMessage,
    setCurrentMessage
  };
}
