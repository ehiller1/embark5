
// src/utils/typeAdapters.ts
import type { NarrativeMessage as TypesNarrativeMessage } from '@/types/NarrativeTypes';
import type { NarrativeMessage as HooksNarrativeMessage } from '@/hooks/useNarrativeGenerationRefactored';
import type { NarrativeMessage, AvatarRole } from '@/types/NarrativeTypes';

/**
 * Convert from the hook's NarrativeMessage[] to your shared Types NarrativeMessage[].
 */
export function convertToTypesNarrativeMessage(
  msgs: HooksNarrativeMessage[]
): TypesNarrativeMessage[] {
  return msgs.map(m => ({
    ...m,
    id: m.id.toString(),
  }));
}
export type { NarrativeMessage } from '@/types/NarrativeTypes';

/**
 * Convert from your shared Types NarrativeMessage[] back to the hook's format.
 */
export function adaptNarrativeMessages(
  msgs: TypesNarrativeMessage[]
): HooksNarrativeMessage[] {
  return msgs.map(m => ({
    ...m,
    id: m.id,
  }));
}

interface RawMsg {
  id: number;
  content: string;
  role: AvatarRole;
  name?: string;
  avatarUrl?: string;
  selected?: boolean;
  timestamp?: Date;
}

export function adaptToNarrativeMessages(raw: RawMsg[]): NarrativeMessage[] {
  return raw.map(item => ({
    ...item,
    id: item.id.toString(), // converts number to string
    content: item.content,
    role: item.role
  }));
}
