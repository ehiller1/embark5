
import { useState, useEffect } from 'react';

import { ConversationInterface } from '@/components/ConversationInterface';
import { DiscernmentPlanViewer } from '@/components/DiscernmentPlanViewer';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useParishCompanion } from '@/hooks/useParishCompanion';
import { useOpenAI } from '@/hooks/useOpenAI';
import { supabase } from '@/integrations/lib/supabase';

export default function Conversation() {
  const navigate = useNavigate();
  const { selectedParishCompanion } = useParishCompanion();
  const { generateResponse, isLoading } = useOpenAI();
  
  // Store messages and system prompt in a single messages array
  const [messages, setMessages] = useState<any[]>([]);

  // Fetch the engagement prompt when a parish companion is selected
  useEffect(() => {
    const fetchPrompt = async () => {
      if (selectedParishCompanion) {
        try {
          const { data, error } = await supabase
            .from('prompts')
            .select('*')
            .eq('prompt_type', 'engagement')
            .single();

          if (error) {
            console.error('Error fetching engagement prompt:', error);
            return;
          }

          if (data) {
            // Insert the selected parish companion details into the prompt
            const promptWithCompanion = data.prompt_text.replace('$(parish companion)', selectedParishCompanion.name);
            
            // Initialize messages with system message and initial user message
            // Convert to format expected by ConversationInterface
            const initialMessages = [
              { 
                text: promptWithCompanion,
                isUser: false 
              },
              { 
                text: 'I want to share my thinking on this document.',
                isUser: true 
              }
            ];
            setMessages(initialMessages);
          }
        } catch (err) {
          console.error('Unexpected error fetching prompt:', err);
        }
      }
    };

    fetchPrompt();
  }, [selectedParishCompanion]);

  // Handle sending new messages
  const handleSendMessage = async (newMessageContent: string) => {
    if (!selectedParishCompanion || !newMessageContent.trim()) return;

    // Add user message using ConversationInterface format
    const newUserMessage = { text: newMessageContent, isUser: true };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);

    try {
      // Convert messages to OpenAI API format for generation
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      }));

      // Add the system message at the beginning
      if (apiMessages.length > 0 && apiMessages[0].role !== 'system') {
        // Use the first non-user message as system prompt if available
        const systemPrompt = messages.find(m => !m.isUser)?.text || '';
        apiMessages.unshift({ role: 'system', content: systemPrompt });
      }

      // Generate AI response
      const response = await generateResponse({
        messages: apiMessages
      });

      if (response) {
        // Add AI response to messages using ConversationInterface format
        setMessages([...updatedMessages, { text: response, isUser: false }]);
      }
    } catch (err) {
      console.error('Error generating response:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-journey-pink hover:bg-journey-lightPink/20 hover:text-journey-darkRed transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> 
          Back
        </Button>
      </div>
      
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-journey mb-4">
          Begin the Conversation
        </h1>
        <div className="p-1 bg-gradient-journey-light rounded-xl">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-base text-gray-700 leading-relaxed">
              Reflect on where we are called by God and respond to this plan sharing your hopes, fears and aspirations.
            </p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <DiscernmentPlanViewer />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-[500px]">
          <ConversationInterface 
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            selectedCompanion={selectedParishCompanion}
          />
        </div>
      </div>
    </div>
  );
}
