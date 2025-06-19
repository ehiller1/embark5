// Type definitions for ControlledConversationInterface component
import { ReactNode } from 'react';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ControlledConversationInterfaceProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string) => void;
  placeholderText?: string;
  children?: ReactNode;
}

export const ControlledConversationInterface: React.FC<ControlledConversationInterfaceProps>;
