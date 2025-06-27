import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/lib/supabase';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  model?: string;
}

export interface OpenAIResponse {
  text: string;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

/**
 * Enhanced OpenAI hook with streaming support, improved error handling, and rate limit management
 */
export const useEnhancedOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingResponse, setStreamingResponse] = useState<string>('');
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    limited: boolean;
    retryAfter: number | null;
  }>({ limited: false, retryAfter: null });

  const generateResponse = useCallback(async (
    options: GenerateOptions, 
    onStreamUpdate?: (text: string) => void
  ): Promise<OpenAIResponse> => {
    const { 
      messages, 
      maxTokens = 1024, 
      temperature = 0.7, 
      stream = false,
      model = 'gpt-4'
    } = options;
    
    setIsLoading(true);
    setError(null);
    
    if (!messages || messages.length === 0) {
      setIsLoading(false);
      setError('No messages provided');
      return { 
        text: '', 
        error: 'No messages provided'
      };
    }

    try {
      // Clear streaming response state if streaming
      if (stream) {
        setStreamingResponse('');
      }

      // Validate messages format
      const invalidMessages = messages.filter(
        msg => !msg.role || !['system', 'user', 'assistant'].includes(msg.role) || !msg.content
      );
      
      if (invalidMessages.length > 0) {
        throw new Error(`Invalid message format: ${JSON.stringify(invalidMessages)}`);
      }

      const requestOptions = {
        body: { 
          messages,
          max_tokens: maxTokens,
          temperature,
          stream,
          model
        }
      };

      if (stream && onStreamUpdate) {
        // Handle streaming response
        const { data: stream } = await supabase.functions.invoke('openai-stream', requestOptions);
        
        if (!stream) {
          throw new Error('Failed to initialize stream');
        }

        let fullText = '';
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            try {
              const parsedChunk = JSON.parse(chunk);
              if (parsedChunk.text) {
                fullText += parsedChunk.text;
                setStreamingResponse(fullText);
                if (onStreamUpdate) onStreamUpdate(fullText);
              }
              if (parsedChunk.error) {
                throw new Error(parsedChunk.error);
              }
            } catch (e) {
              // Handle unparseable chunks (like single deltas)
              console.warn('Could not parse streaming chunk:', chunk);
            }
          }
        } finally {
          reader.releaseLock();
        }
        
        setIsLoading(false);
        return {
          text: fullText
        };
      } else {
        // Handle non-streaming response
        const response = await supabase.functions.invoke('openai', requestOptions);
        
        if (response.error) {
          throw new Error(response.error.message || 'Error calling OpenAI');
        }
        
        if (response.data?.rateLimited) {
          setRateLimitInfo({
            limited: true,
            retryAfter: response.data.retryAfter || 60
          });
        }
        
        setIsLoading(false);
        return {
          text: response.data?.text || '',
          error: response.data?.error,
          rateLimited: response.data?.rateLimited,
          retryAfter: response.data?.retryAfter
        };
      }
    } catch (err: any) {
      setIsLoading(false);
      const errorMessage = err.message || 'Unknown error occurred';
      setError(errorMessage);
      
      return {
        text: '',
        error: errorMessage
      };
    }
  }, []);

  const cancelStreaming = useCallback(() => {
    // Logic to cancel an ongoing streaming request would go here
    // This would involve aborting the fetch request
    setIsLoading(false);
  }, []);

  return {
    generateResponse,
    cancelStreaming,
    isLoading,
    error,
    streamingResponse,
    isRateLimited: rateLimitInfo.limited,
    rateLimitRetryAfter: rateLimitInfo.retryAfter,
    clearError: () => setError(null)
  };
};

export default useEnhancedOpenAI;
