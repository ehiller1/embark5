import { vi } from 'vitest';

// --- Mock Functions ---
export const mockGeneratePlan = vi.fn();
export const mockEnhancePlan = vi.fn();
export const mockNavigate = vi.fn();
export const mockSupabaseSelect = vi.fn().mockReturnThis();
export const mockSupabaseEq = vi.fn().mockReturnThis();
export const mockSupabaseIn = vi.fn().mockResolvedValue({ data: [], error: null });
export const mockSupabaseInsert = vi.fn().mockResolvedValue({ data: [{}], error: null });
export const mockGenerateResponse = vi.fn();
export const mockGetRateLimitStatus = vi.fn().mockReturnValue({ limited: false, waitTime: 0 });
export const mockCancelAllRequests = vi.fn();
export const mockGetPromptByType = vi.fn();
export const mockToast = vi.fn();
