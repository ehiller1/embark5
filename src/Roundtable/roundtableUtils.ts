
export interface RoundtableMessage {
  id: string;
  role: "user" | "participant" | "system" | "church" | "community" | "companion";
  name: string;
  avatarUrl?: string;
  content: string;
  timestamp: Date;
  isSpeaking?: boolean;
}

export type AvatarRole = "church" | "community" | "companion";

export const createRoundtableMessage = (params: Omit<RoundtableMessage, 'id' | 'timestamp'>) => ({
  id: crypto.randomUUID(),
  timestamp: new Date(),
  ...params
});
