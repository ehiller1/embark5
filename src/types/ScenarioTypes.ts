
// This is a temporary file to help with migration between type systems
// Re-export types from NarrativeTypes to maintain compatibility

import { ScenarioItem, Message } from './NarrativeTypes';

// Re-export ScenarioItem for backward compatibility
export type { ScenarioItem, Message };
