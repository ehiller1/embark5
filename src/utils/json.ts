// src/utils/json.ts

/**
 * Safely parse a JSON string into type T, returning a fallback on error.
 */
export function safeJsonParse<T>(text: string, fallback: T = null as any): T {
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.error('[safeJsonParse] JSON parse error:', err);
    return fallback;
  }
}

/**
 * Given a JSON‐stringified array of messages with { sender, content },
 * returns a human‐readable block of text with prefixes.
 */
export function formatMessages(raw: string | null): string {
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw) as Array<{
      sender: 'system' | 'assistant' | 'user';
      content: string;
    }>;

    if (Array.isArray(parsed)) {
      return parsed
        .map((msg) => {
          const prefix =
            msg.sender === 'system'
              ? 'System: '
              : msg.sender === 'assistant'
              ? 'Assistant: '
              : msg.sender === 'user'
              ? 'User: '
              : '';
          return `${prefix}${msg.content}`;
        })
        .join('\n\n');
    }

    // If it wasn’t an array, just return the raw string
    return raw;
  } catch {
    return raw;
  }
}

/**
 * If you ever need to pull out the first {...} block from
 * a blob of text, you can use this helper.
 */
export function extractJsonFromText(text: string): any | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const jsonStr = text.substring(start, end + 1);
    try {
      return JSON.parse(jsonStr);
    } catch (err) {
      console.error('[extractJsonFromText] Failed to extract JSON:', err);
      return null;
    }
  }
  return null;
}
