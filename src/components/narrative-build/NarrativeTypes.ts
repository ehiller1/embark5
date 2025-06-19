
// src/components/narrative-build/NarrativeTypes.ts
import type { NarrativeMessage, Companion } from '@/types/NarrativeTypes';
import type { ChurchAvatar, CommunityAvatar } from '@/hooks/useNarrativeAvatar';

export type AvatarRole = 'companion' | 'church' | 'community';

export interface AvatarUnion {
  id?: string | number;
  role: AvatarRole;
  name: string;
  avatarUrl?: string;
  avatar_name?: string;
  avatar_point_of_view?: string;
  image_url?: string;

  // Companion-specific
  companion?: string;
  traits?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
}

export interface AvatarInteractionProps {
  selectedCompanion: Companion | null;
  selectedChurchAvatar: ChurchAvatar | null;
  selectedCommunityAvatar: CommunityAvatar | null;
  activeCard: AvatarRole | null;
  handleAvatarClick: (role: AvatarRole) => void;
}

export interface VocationalSidebarProps {
  sectionAvatar: any;
  selectedCompanion: Companion | null;
  selectedChurchAvatar: ChurchAvatar | null;
  selectedCommunityAvatar: CommunityAvatar | null;
  activeCard: AvatarRole | null;
  handleAvatarCardClick: (role: AvatarRole) => void;
  handleViewDetails: (role: AvatarRole) => void;
  activePerspective: string;
  handleSwitchPerspective: (perspective: string) => void;
}

export interface StatementSelectionProps {
  selectedMessages: NarrativeMessage[];
  allMessages: NarrativeMessage[];
  onMessageSelect: (index: number) => void;
  currentAvatarRole?: AvatarRole | null;
  onChangeAvatarFilter?: (role: AvatarRole | null) => void;
}

export interface EnhancedNarrativeConversationProps {
  messages: NarrativeMessage[];
  isGenerating: boolean;
  promptsLoaded: boolean;
  initialSetupCompleted: boolean;
  onMessageSelect: (index: number) => void;
  error: string | null;
  onRetry: () => void;
}

export interface VocationalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  narrativeContext: string;
  onSaveStatement: (statement: any) => void;
}

