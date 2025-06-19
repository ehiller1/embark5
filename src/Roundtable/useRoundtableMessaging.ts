
import { useState, useEffect, useCallback } from 'react';
import { RoundtableMessage, createRoundtableMessage, AvatarRole } from './roundtableUtils';
import { useSelectedCompanion } from '@/hooks/useSelectedCompanion';
import { useNarrativeAvatar } from '@/hooks/useNarrativeAvatar';

export function useRoundtableMessaging() {
  const [messages, setMessages] = useState<RoundtableMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const { selectedCompanion } = useSelectedCompanion();
  const { selectedChurchAvatar, selectedCommunityAvatar } = useNarrativeAvatar();

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
      if (selectedChurchAvatar) {
        addMessage({
          role: 'church',
          content: `From the church perspective, I'm considering "${content.trim()}"`,
          name: selectedChurchAvatar.name || 'Church Avatar',
          avatarUrl: selectedChurchAvatar.avatar_url || selectedChurchAvatar.image_url
        });
      }
      
      if (selectedCommunityAvatar) {
        addMessage({
          role: 'community',
          content: `From the community perspective, I'm thinking about "${content.trim()}"`,
          name: selectedCommunityAvatar.name || 'Community Avatar',
          avatarUrl: selectedCommunityAvatar.avatar_url || selectedCommunityAvatar.image_url
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
  }, [addMessage, selectedCompanion, selectedChurchAvatar, selectedCommunityAvatar]);

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
