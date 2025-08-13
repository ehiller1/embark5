/**
 * Message parsing utilities to handle various OpenAI response formats
 */

// Main message validation function that delegates to type-specific parsers
export const validateMessage = (text: string): string => {
  try {
    // First check if it looks like JSON
    if (isLikelyJson(text)) {
      // Try to parse as JSON first
      try {
        const trimmedText = text.trim();
        const jsonString = extractJsonFromMarkdown(trimmedText);
        const parsedJson = JSON.parse(jsonString);
        
        // Determine the response type and use the appropriate parser
        if (parsedJson.messages && Array.isArray(parsedJson.messages)) {
          return parseMessagesArrayResponse(parsedJson);
        } else if (parsedJson.discernment_plan) {
          return parseDiscernmentPlanResponse(parsedJson);
        } else if (parsedJson.content || (parsedJson.role && parsedJson.content)) {
          return parseDirectContentResponse(parsedJson);
        } else if (parsedJson.scenario || parsedJson.scenarios) {
          return parseScenarioResponse(parsedJson);
        } else {
          // Generic JSON object - try to extract meaningful content
          return parseGenericJsonResponse(parsedJson);
        }
      } catch (error) {
        console.warn('[validateMessage] Failed to parse as JSON:', error);
        // If JSON parsing fails, fall back to text processing
        return cleanupTextResponse(text);
      }
    }
    
    // If it doesn't look like JSON, just clean up the text
    return cleanupTextResponse(text);
  } catch (error) {
    console.error('[validateMessage] Error validating message:', error);
    return "I'm sorry, there was an error processing my response. How else can I assist you today?";
  }
};

// Check if the text is likely to be JSON
function isLikelyJson(text: string): boolean {
  const trimmed = text.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    trimmed.includes('```json')
  );
}

// Extract JSON from markdown code blocks if present
function extractJsonFromMarkdown(text: string): string {
  // Check for markdown code fences
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }
  return text;
}

// Parser for responses containing a messages array
function parseMessagesArrayResponse(parsedJson: any): string {
  if (!parsedJson.messages || !Array.isArray(parsedJson.messages)) {
    throw new Error('Expected messages array not found');
  }
  
  // First, look for an assistant message (highest priority)
  const assistantMessage = parsedJson.messages.find(
    (msg: any) => msg.role === 'assistant' && msg.content
  );
  
  if (assistantMessage?.content) {
    return assistantMessage.content;
  }
  
  // Second, look for a system message (next priority)
  const systemMessage = parsedJson.messages.find(
    (msg: any) => msg.role === 'system' && msg.content
  );
  
  if (systemMessage?.content) {
    return systemMessage.content;
  }
  
  // Third, look for a user message
  const userMessage = parsedJson.messages.find(
    (msg: any) => msg.role === 'user' && msg.content
  );
  
  if (userMessage?.content) {
    return userMessage.content;
  }
  
  // If no specific role message found, take the first message with content
  const firstWithContent = parsedJson.messages.find((msg: any) => msg.content);
  if (firstWithContent?.content) {
    return firstWithContent.content;
  }
  
  // Last resort, take the last message
  const lastMessage = parsedJson.messages[parsedJson.messages.length - 1];
  if (lastMessage?.content) {
    return lastMessage.content;
  }
  
  throw new Error('No valid message content found in messages array');
}

// Parser for responses with direct content property
function parseDirectContentResponse(parsedJson: any): string {
  if (parsedJson.content && typeof parsedJson.content === 'string') {
    return parsedJson.content;
  }
  
  if (parsedJson.role && parsedJson.content) {
    return parsedJson.content;
  }
  
  throw new Error('Expected content property not found');
}

// Parser for discernment plan responses
function parseDiscernmentPlanResponse(parsedJson: any): string {
  if (!parsedJson.discernment_plan) {
    throw new Error('Expected discernment_plan property not found');
  }
  
  // For discernment plans, we just acknowledge receipt - actual parsing happens in useDiscernmentPlan.ts
  return 'I have prepared a discernment plan based on our conversation. Would you like to review it now?';
}

// Parser for scenario responses
function parseScenarioResponse(parsedJson: any): string {
  if (parsedJson.scenario) {
    return `I've created a scenario based on our conversation: ${parsedJson.scenario.title || 'Untitled Scenario'}`;
  }
  
  if (parsedJson.scenarios && Array.isArray(parsedJson.scenarios) && parsedJson.scenarios.length > 0) {
    return `I've created ${parsedJson.scenarios.length} scenarios based on our conversation.`;
  }
  
  throw new Error('No valid scenario content found');
}

// Parser for generic JSON responses
function parseGenericJsonResponse(parsedJson: any): string {
  // Try to find any string property that might contain meaningful content
  for (const key of ['text', 'message', 'description', 'response', 'result', 'output']) {
    if (typeof parsedJson[key] === 'string' && parsedJson[key].length > 0) {
      return parsedJson[key];
    }
  }
  
  // If it's a simple string value
  if (typeof parsedJson === 'string') {
    return parsedJson;
  }
  
  // Last resort: stringify the object but warn about it
  console.warn('[parseGenericJsonResponse] Unable to find meaningful content in JSON', parsedJson);
  return JSON.stringify(parsedJson);
}

// Clean up and format plain text responses
function cleanupTextResponse(text: string): string {
  // Remove any markdown artifacts
  let cleaned = text.replace(/```[\s\S]*?```/g, '');
  
  // Remove extra whitespace
  cleaned = cleaned.trim().replace(/\n{3,}/g, '\n\n');
  
  return cleaned || "I'm sorry, I couldn't generate a proper response.";
}


export function renderMessageContent(content: string): string {
  try {
    // Check if the content looks like JSON before attempting to parse
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      try {
        console.log('[renderMessageContent] Attempting to parse JSON:', content.substring(0, 100) + '...');
        const parsed = JSON.parse(content);
        
        // Handle the messages array format
        if (typeof parsed === 'object' && parsed !== null && Array.isArray(parsed.messages)) {
          console.log('[renderMessageContent] Found messages array with', parsed.messages.length, 'messages');
          
          // Prefer assistant messages first
          const assistantMsg = parsed.messages.find(
            (m: { role: string; content: string }) => m.role === 'assistant' && m.content
          );
          if (assistantMsg?.content) {
            console.log('[renderMessageContent] Using assistant message content');
            return assistantMsg.content;
          }

          // Then fall back to system messages
          const systemMsg = parsed.messages.find(
            (m: { role: string; content: string }) => m.role === 'system' && m.content
          );
          if (systemMsg?.content) {
            console.log('[renderMessageContent] Using system message content (no assistant present)');
            return systemMsg.content;
          }
          
          // Fall back to any message with content
          const anyMsgWithContent = parsed.messages.find(
            (m: { role: string; content: string }) => m.content && m.content.trim().length > 0
          );
          
          if (anyMsgWithContent?.content) {
            console.log('[renderMessageContent] Using fallback message content from role:', anyMsgWithContent.role);
            return anyMsgWithContent.content;
          }
        }
      } catch (jsonError) {
        console.warn('[renderMessageContent] Failed to parse content as JSON:', jsonError);
      }
    }

    // If not JSON or no valid messages found, return the content as-is
    return content;
  } catch (error) {
    console.error('[renderMessageContent] Error processing message content:', error);
    return content;
  }
}
