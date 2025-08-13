
import { useState, useRef } from "react";
// Removed unused toast import
import { supabase } from "@/integrations/lib/supabase";

interface GenerateOptions {
  messages: Array<{
    role: string;
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  signal?: AbortSignal;
}

interface OpenAIResponse {
  text: string;
  error?: string;
  rateLimited?: boolean;
  retryAfter?: number;
}

const rateLimitState = {
  isRateLimited: false,
  retryAfter: 0,
  lastRateLimitHit: 0,
  consecutiveRateLimits: 0,
};

export const useOpenAI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRequestsRef = useRef<{ [id: string]: AbortController }>({});

  const resetError = () => {
    setError(null);
  };

  const isCurrentlyRateLimited = () => {
    if (!rateLimitState.isRateLimited) return false;
    
    const now = Date.now();
    const timeElapsed = now - rateLimitState.lastRateLimitHit;
    const shouldStillLimit = timeElapsed < rateLimitState.retryAfter;
    
    if (!shouldStillLimit) {
      rateLimitState.isRateLimited = false;
      rateLimitState.consecutiveRateLimits = 0;
    }
    
    return shouldStillLimit;
  };

  const handleRateLimit = (retryAfterHeader: string | null) => {
    let retryAfterMs = 2000;
    
    if (retryAfterHeader) {
      retryAfterMs = parseInt(retryAfterHeader) * 1000;
    } else {
      const baseDelay = 2000;
      retryAfterMs = Math.min(
        baseDelay * Math.pow(2, rateLimitState.consecutiveRateLimits),
        60000
      );
    }
    
    rateLimitState.isRateLimited = true;
    rateLimitState.lastRateLimitHit = Date.now();
    rateLimitState.retryAfter = retryAfterMs;
    rateLimitState.consecutiveRateLimits++;
    
    return retryAfterMs;
  };

  const generateResponse = async (options: GenerateOptions): Promise<OpenAIResponse> => {
    const { messages, maxTokens = 800, temperature = 0.7 } = options;
    
    // Log the full request payload
    const requestPayload = {
      messages,
      maxTokens,
      temperature
    };
    
    console.log('[useOpenAI] Full request payload:', JSON.stringify(requestPayload, null, 2));

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    // Log the request
    console.log('[useOpenAI] Sending request to OpenAI:', {
      messageCount: messages.length,
      firstMessage: messages[0]?.content?.substring(0, 50),
      secondMessage: messages.length > 1 ? messages[1]?.content?.substring(0, 50) : 'none'
    });

    // Validate message structure
    const validRoles = ['system', 'user', 'assistant'];
    for (const message of messages) {
      if (!validRoles.includes(message.role)) {
        throw new Error(`Invalid message role: ${message.role}`);
      }
      if (!message.content || typeof message.content !== 'string') {
        throw new Error('Invalid message content');
      }
    }

    // Check if we're rate limited
    if (isCurrentlyRateLimited()) {
      const waitTime = handleRateLimit(null);
      return {
        text: '',
        error: `Rate limited. Please wait ${waitTime} seconds before trying again.`,
        rateLimited: true,
        retryAfter: waitTime
      };
    }

    // Create a new AbortController for this request
    const controller = new AbortController();
    const requestId = Math.random().toString(36).substring(2, 9);
    activeRequestsRef.current[requestId] = controller;

    try {
      setIsLoading(true);
      
      // Use Supabase functions invoke instead of direct fetch
      // Clean up messages to only include expected fields
      const cleanedMessages = messages.map(({ role, content }) => ({
        role,
        content
      }));
      
      // Extract system message and user message for Edge Function
      let systemPrompt = options.systemPrompt || 'You are a helpful assistant.';
      let prompt = '';
      
      // If no explicit systemPrompt was provided, look for a system message
      if (!options.systemPrompt) {
        const systemMessage = cleanedMessages.find(m => m.role === 'system');
        if (systemMessage) {
          systemPrompt = systemMessage.content;
        }
      }
      
      // Get the first user message as the prompt
      const userMessage = cleanedMessages.find(m => m.role === 'user');
      if (userMessage) {
        prompt = userMessage.content;
      } else if (cleanedMessages.length > 0) {
        // Fallback: use the first message regardless of role
        prompt = cleanedMessages[0].content;
      }
      
      // Log the extracted prompts
      console.log('[useOpenAI] Extracted prompts:', {
        systemPrompt: systemPrompt?.substring(0, 100) + '...',
        prompt: prompt?.substring(0, 100) + '...'
      });
      
      const requestOptions = {
        body: {
          messages: cleanedMessages, // Keep this for backward compatibility
          prompt: prompt,            // Add explicit prompt field for Edge Function
          systemPrompt: systemPrompt, // Add explicit systemPrompt field for Edge Function
          maxTokens,
          temperature
        },
        abortSignal: options.signal || controller.signal
      };
      
      console.log('[useOpenAI] Supabase invoke options:', JSON.stringify({
        ...requestOptions,
        body: {
          ...requestOptions.body,
          messages: requestOptions.body.messages.map(m => ({
            ...m,
            content: m.content.substring(0, 50) + (m.content.length > 50 ? '...' : '')
          }))
        },
        // Don't log the abort signal as it's not serializable
        abortSignal: requestOptions.abortSignal ? '[AbortSignal]' : undefined
      }, null, 2));
      
      const response = await supabase.functions.invoke('openai', requestOptions);

      console.log('[useOpenAI] Received response:', response);

      if (response.error) {
        console.error('[useOpenAI] Edge function error:', {
          message: response.error.message,
          name: (response.error as any)?.name,
        });
        return {
          text: '',
          error: response.error.message || 'Failed to generate response',
        };
      }

      return {
        text: response.data?.text || '',
        error: response.data?.error,
        rateLimited: response.data?.rateLimited,
        retryAfter: response.data?.retryAfter
      };
    } catch (error) {
      // Safely extract error details with type checking
      const errorDetails = {
        errorString: String(error),
        ...(error instanceof Error ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack
        } : {}),
        ...(error && typeof error === 'object' ? {
          errorCode: (error as any).code,
          errorStatus: (error as any).status,
          errorStatusText: (error as any).statusText,
          errorResponse: (error as any).response
        } : {})
      };
      
      console.error('[useOpenAI] Full error details:', errorDetails);
      
      if (error instanceof Error) {
        return {
          text: '',
          error: error.message
        };
      }
      return {
        text: '',
        error: 'An unknown error occurred'
      };
    } finally {
      setIsLoading(false);
      delete activeRequestsRef.current[requestId];
    }
  };

  const cancelAllRequests = () => {
    console.log("[useOpenAI] Cancelling all pending requests");
    Object.values(activeRequestsRef.current).forEach(controller => {
      (controller as AbortController).abort();
    });
    activeRequestsRef.current = {};
    setIsLoading(false);
  };

  const getRateLimitStatus = () => {
    if (isCurrentlyRateLimited()) {
      const waitTimeRemaining = Math.ceil(
        (rateLimitState.retryAfter - (Date.now() - rateLimitState.lastRateLimitHit)) / 1000
      );
      return {
        limited: true, 
        waitTime: waitTimeRemaining,
        retryAt: new Date(Date.now() + waitTimeRemaining * 1000)
      };
    }
    return { limited: false, waitTime: 0, retryAt: new Date() };
  };

  return {
    generateResponse,
    isLoading,
    error,
    resetError,
    cancelAllRequests,
    getRateLimitStatus
  };
};
