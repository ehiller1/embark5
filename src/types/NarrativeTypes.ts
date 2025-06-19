
// src/types/NarrativeTypes.ts

/**
 * Filter selected statements into your vocational dialog
 */
export interface VocationalFilter {
  name: string;
  statement: string;
  createdAt: string;
}

/**
 * Single chat message in the narrative conversation
 */
export interface NarrativeMessage {
  /** Unique numeric ID */
  id: string;
  /** The text content of the message */
  content: string;
  /** Which avatar or role spoke this message */
  role: AvatarRole;
  /** Friendly display name for the speaker */
  name?: string;
  /** URL to the speaker's avatar image */
  avatarUrl?: string;
  /** Has the user selected this statement for vocational building? */
  selected?: boolean;
  /** When the message was created */
  timestamp?: Date;
}

/**
 * Base interface for any narrative avatar (church, community, companion)
 */
export interface BaseNarrativeAvatar {
  id: string;
  name: string;
  role: string;
  avatar_point_of_view: string;
  image_url?: string;
  avatar_url?: string;
  avatar_name?: string;
}

/** Specific church avatar */
export interface ChurchAvatar extends BaseNarrativeAvatar {
  role: 'church';
  avatar_name?: string;
}

/** Specific community avatar */
export interface CommunityAvatar extends BaseNarrativeAvatar {
  role: 'community';
  avatar_name?: string;
}

/** A scenario the user can plan for */
export interface ScenarioItem {
  id: string;
  title: string;
  description: string;
  is_refined?: boolean; // Added to track if a scenario has been through user refinement
  targetAudience?: string[];
  strategicRationale?: string;
  theologicalJustification?: string;
  potentialChallengesBenefits?: string;
  successIndicators?: string;
}

/** A simple message item (used outside narrative conversation) */
export interface MessageItem {
  role: string;
  content: string;
}

/**
 * Companion metadata (guide persona) for plan generation
 */
export interface Companion {
  UUID?: number;
  companion?: string;
  traits?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
  avatar_url?: string;
  // Added properties that were missing
  churchAvatar?: ChurchAvatar | null;
  communityAvatar?: CommunityAvatar | null;
}

/**
 * Minimal avatar data for UI mentions
 */
export interface AvatarData {
  name: string;
  role: string;
  avatarUrl?: string;
}

/**
 * Which perspective an avatar or user can have
 */
export type AvatarPerspective = 'all' | 'church' | 'community' | 'companion';

/**
 * All allowed avatar roles in conversation
 */
export type AvatarRole = 'church' | 'community' | 'companion' | 'system' | 'user' | 'synthesized';

/** Message type used in scenario messaging */
export interface Message {
  role: string;
  content: string;
  source?: 'companion' | 'church' | 'community' | 'section' | 'system';
  name?: string;
  avatar?: string | null;
}

/** Refined scenario output from refinement process */
export interface RefinedScenario {
  title: string;
  refinedScenario: string;
  success?: boolean;
  text?: string;
}

/**
 * Type alias for vocational_statement (same as VocationalFilter)
 * Added for backward compatibility
 */
export type vocational_statement = VocationalFilter;

/**
 * Represents a vocational statement with metadata
 */
export interface VocationalStatement {
  id: string;
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  resourceType: 'narrative_statement';
  category: 'narrative';
  user_id?: string; // Added to fix lint error bab7ba15-ba0d-450d-ada2-d61c73da6637
  original_ids?: string[]; // Added to support multi-synthesis tracking
}

/**
 * Props for the Vocational Statement Dialog component
 */
export interface VocationalDialogProps {
  isOpen: boolean; // Renamed from 'open' for clarity with dialog state management in parent
  onClose: () => void; // Renamed from onOpenChange for clarity
  onSave: (statementData: Partial<VocationalStatement> & { name: string; content: string; id?: string }) => void; // More generic save handler
  isLoading?: boolean; // To show loading state on save button
  narrativeContext?: string; // Make optional, as initialStatementData will be primary for editing
  initialStatementData?: UIVocationalStatement | null; // For pre-filling the dialog for an edit
  selectedStatements?: (NarrativeMessage | VocationalStatement)[]; // If needed for 'Adapt' flow, keep for now
  mode?: 'add' | 'edit' | 'adapt'; // Mode for the dialog (add new, edit existing, adapt from others)
  avatarRole?: AvatarRole | 'system'; // Role of the avatar associated with this statement
}

/**
 * Props for the Vocational Statements Container component
 */
// Assuming PromptType might be in this file or a similar one. If not, this change is illustrative.
// export type PromptType = 'existing_prompt_1' | 'existing_prompt_2' | 'vocational_statement_synthesis' | 'vocational_statement_synthesis_multiple';

import { ScenarioItem as ScenarioCardItem } from '@/components/ScenarioCard';

// Extend the imported ScenarioItem to include selected property
export interface ScenarioItem extends ScenarioCardItem {
  // For UI/selection state
  selected?: boolean;
}

export type UIVocationalStatement = VocationalStatement & {
  id: string;
  avatar_name?: string;
  avatar_url?: string;
  avatar_role?: AvatarRole;
  mission_statement?: string;
  contextual_explanation?: string;
  theological_justification?: string;
  practical_application?: string;
  rank?: number; // Added rank property for ordering statements by importance
};

export interface VocationalStatementsContainerProps {
  selectedMessages: NarrativeMessage[];
  allMessages?: NarrativeMessage[];
  onEditNarrative: () => void;
  handleNavigateToScenario: () => void;
  handleFinalizeVocation: () => void;
  onRemoveStatement?: (index: number) => void;
  onRegenerateAvatar?: (role: string) => void;
  selectedStatementsForHighlighting?: Array<{ id: string }>; // Added
  isEmpty: boolean;
  generatedStatements?: Record<AvatarRole, UIVocationalStatement[]>; // Updated type
  isGeneratingStatement?: Record<AvatarRole, boolean>; // Kept as AvatarRole for now
  onStatementSelect?: (message: NarrativeMessage | UIVocationalStatement) => void; // Added
  onOpenEditDialog?: (statement: NarrativeMessage | UIVocationalStatement) => void; // Added
  isLoadingSynthesis?: boolean;
}
