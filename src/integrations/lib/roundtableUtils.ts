// src/lib/roundtableUtils.ts

import { supabase } from '@/lib/supabase';

export interface RoundtableMessage {
  id: string;
  role: "user" | "participant" | "system" | "church" | "community" | "companion" | "assistant";
  name: string;
  avatarUrl?: string;
  content: string;
  timestamp: Date;
  isSpeaking?: boolean;
}

// Create a new roundtable message with auto-generated ID and timestamp
export const createRoundtableMessage = (params: Omit<RoundtableMessage, 'id' | 'timestamp'>): RoundtableMessage => ({
  id: crypto.randomUUID(),
  timestamp: new Date(),
  ...params
});

// Fetch a prompt by type from the Supabase 'prompts' table
export async function fetchPromptByType(promptType: string) {
  const { data, error } = await supabase
    .from('prompts')
    .select('prompt')
    .eq('prompt_type', promptType)
    .single();

  if (error) {
    console.error(`[RoundtableUtils] Failed to fetch prompt for ${promptType}:`, error);
    return { success: false };
  }

  return { success: true, text: data?.prompt || '' };
}
