
import { useState } from 'react';

interface Message {
  role: string;
  content: string;
}

export const useChurchAssessment = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const saveMessage = async (message: Message) => {
    setMessages(prev => [...prev, message]);
    return message;
  };
  
  const resetMessages = async () => {
    setMessages([]);
  };
  
  return {
    messages,
    isLoading,
    saveMessage,
    resetMessages
  };
};
