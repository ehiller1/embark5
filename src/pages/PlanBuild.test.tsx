/// <reference types="@testing-library/jest-dom" />
// src/pages/PlanBuild.test.tsx
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PlanBuilder } from './PlanBuild';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { supabase } from '@/integrations/lib/supabase';
// import { ToastProvider } from '@/components/ui/toast/toast-provider'; // Path incorrect, needs verification // Assuming this is how your ToastProvider is set up

import {
  mockEnhancePlan,
  mockGeneratePlan,
  mockNavigate,
  mockSupabaseSelect,
  mockSupabaseEq,
  mockSupabaseIn,
  mockSupabaseInsert,
  mockGenerateResponse,
  mockGetRateLimitStatus,
  mockCancelAllRequests,
  mockGetPromptByType,
  mockToast,
} from '@/test/mocks';

// --- Mock Implementations ---
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/integrations/lib/auth/AuthProvider');
const mockedUseAuth = useAuth as Mock;

const createMockAuth = (user: {id: string, email: string} | null = { id: 'test-user-id', email: 'test@example.com' }) => ({
  user,
  session: user ? { user } as any : null,
  isAuthenticated: !!user,
  loading: false,
  login: vi.fn(),
  signOut: vi.fn(),
  signup: vi.fn(),
});

vi.mock('@/integrations/lib/supabase');

vi.mock('@/hooks/useOpenAI', () => ({
  useOpenAI: () => ({
    generateResponse: mockGenerateResponse,
    getRateLimitStatus: mockGetRateLimitStatus,
    cancelAllRequests: mockCancelAllRequests,
  }),
}));

vi.mock('@/hooks/usePrompts', () => ({
  usePrompts: () => ({
    getPromptByType: mockGetPromptByType,
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock localStorage
let store: Record<string, string> = {};
const localStorageMock = (() => {
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// --- Helper to render with providers --- 
const renderWithProviders = (
  ui: React.ReactElement,
  { route = '/plan_build' } = {}
) => {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/plan_build" element={ui} />
        <Route path="/community_research" element={<div>Community Research Page</div>} />
      </Routes>
    </MemoryRouter>
  );
};

// --- Test Suites --- 
describe('PlanBuilder Component', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Clear localStorage mock
    localStorageMock.clear();

    // Set up default mock implementations
    mockedUseAuth.mockReturnValue(createMockAuth());

    // Reset Supabase mock implementations for chained calls
    (supabase.from as Mock).mockReturnValue({
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
    });
    mockSupabaseSelect.mockReturnValue({
      eq: mockSupabaseEq,
      in: mockSupabaseIn,
    });
    mockSupabaseEq.mockReturnValue({
      in: mockSupabaseIn,
    });
    mockSupabaseIn.mockResolvedValue({ data: [], error: null });
    mockSupabaseInsert.mockResolvedValue({ data: [{}], error: null });

    // Reset other mocks
    mockGeneratePlan.mockResolvedValue('Generated plan content.');
    mockEnhancePlan.mockResolvedValue('Enhanced plan content.');
    mockGetPromptByType.mockResolvedValue({ 
      success: true, 
      data: { prompt: 'Test prompt for $(vocational_statement) and $(scenario_details) and $(selected_scenarios)' }
    });
    mockToast.mockClear(); // Clear any calls to toast from previous tests
  });

  describe('Prerequisites Not Met', () => {
    it('should display informational modal if no prerequisites are found', async () => {
      mockSupabaseIn.mockResolvedValueOnce({ data: [], error: null }); // No data from Supabase
      renderWithProviders(<PlanBuilder open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Building a Discernment Plan')).toBeInTheDocument();
      });
      expect(screen.getByText('Research on Community (Summary saved)')).toBeInTheDocument();
      expect(screen.getByText('Start Prerequisite Steps')).toBeInTheDocument();
      expect(screen.getAllByText(/missing/i).length).toBeGreaterThanOrEqual(3); // Check for missing messages
    });

    it('should navigate to /community_research when "Start Prerequisite Steps" is clicked', async () => {
      mockSupabaseIn.mockResolvedValueOnce({ data: [], error: null });
      renderWithProviders(<PlanBuilder open={true} />);
      
      await waitFor(() => {
        expect(screen.getByText('Start Prerequisite Steps')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Start Prerequisite Steps'));
      expect(mockNavigate).toHaveBeenCalledWith('/community_research');
    });

    it('should show specific missing items if some are present in local storage', async () => {
      localStorageMock.setItem('research_summary', 'Some summary data');
      mockSupabaseIn.mockResolvedValueOnce({ data: [], error: null }); // No data from Supabase for others
      renderWithProviders(<PlanBuilder open={true} />);

      await waitFor(() => {
        expect(screen.getByText('✓ Research Summary found.')).toBeInTheDocument();
      });
      expect(screen.getByText('✗ Vocational Statement missing.')).toBeInTheDocument();
      expect(screen.getByText('✗ Scenario Details missing.')).toBeInTheDocument();
    });
  });

  describe('Prerequisites Met', () => {
    const mockResearchSummary = 'Test Research Summary';
    const mockVocationalStatement = { id: 'vs1', statement: 'Test Vocational Statement' };
    const mockScenarioDetailsArray = [{ id: 'sc1', title: 'Test Scenario', description: 'Details for test scenario' }];

    beforeEach(() => {
      localStorageMock.setItem('research_summary', mockResearchSummary);
      localStorageMock.setItem('vocational_statement', JSON.stringify(mockVocationalStatement));
      localStorageMock.setItem('selected_scenarios', JSON.stringify(mockScenarioDetailsArray));
      mockGenerateResponse.mockResolvedValue({ text: 'Generated plan content.', error: null });
    });

    it('should display plan generation UI and auto-generate plan if all prerequisites in localStorage', async () => {
      renderWithProviders(<PlanBuilder open={true} />); 
      
      await waitFor(() => {
        expect(screen.getByText('Discernment Plan')).toBeInTheDocument();
      });
      expect(mockGetPromptByType).toHaveBeenCalled();
      expect(mockGenerateResponse).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText('Generated plan content.')).toBeInTheDocument();
      });
    });

    it('should fetch from Supabase if localStorage is empty and then generate plan', async () => {
      localStorageMock.clear();
      mockSupabaseIn.mockResolvedValueOnce({ 
        data: [
          { type: 'research_summary', content: mockResearchSummary },
          { type: 'vocational_statement', content: mockVocationalStatement },
          { type: 'scenario_details', content: mockScenarioDetailsArray[0] } // Assuming DB stores single, will be wrapped in array
        ],
        error: null 
      });

      renderWithProviders(<PlanBuilder open={true} />);

      await waitFor(() => {
        expect(screen.getByText('Discernment Plan')).toBeInTheDocument();
      });
      expect(mockGenerateResponse).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText('Generated plan content.')).toBeInTheDocument();
      });
    });

    it('should allow editing the plan', async () => {
      renderWithProviders(<PlanBuilder open={true} />); 
      await waitFor(() => screen.getByText('Discernment Plan'));
      fireEvent.click(screen.getByRole('button', { name: /Edit/i }));
      const textarea = await screen.findByRole('textbox');
      expect(textarea).toBeInTheDocument();
      fireEvent.change(textarea, { target: { value: 'Manually edited plan.' } });
      expect(textarea).toHaveValue('Manually edited plan.');
    });

    it('should allow enhancing the plan', async () => {
      renderWithProviders(<PlanBuilder open={true} />); 
      await waitFor(() => screen.getByText('Generated plan content.'));

      const enhancementInput = screen.getByPlaceholderText('Suggest an enhancement...');
      fireEvent.change(enhancementInput, { target: { value: 'Make it better' } });
      
      mockGenerateResponse.mockResolvedValueOnce({ text: 'Enhanced plan content.', error: null });
      fireEvent.click(screen.getByRole('button', { name: /Enhance/i }));

      await waitFor(() => {
        expect(screen.getByText('Enhanced plan content.')).toBeInTheDocument();
      });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Plan Enhanced' }));
    });

    it('should allow saving the plan', async () => {
      mockSupabaseInsert.mockResolvedValueOnce({ data: [{}], error: null });
      renderWithProviders(<PlanBuilder open={true} />); 
      await waitFor(() => screen.getByText('Generated plan content.'));

      fireEvent.click(screen.getByRole('button', { name: /Save/i }));
      // Confirm dialog appears
      expect(await screen.findByText('Confirm Save')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Save Plan/i }));

      await waitFor(() => {
        expect(mockSupabaseInsert).toHaveBeenCalledWith(expect.objectContaining({
          scenario_id: mockScenarioDetailsArray[0].id,
          content: 'Generated plan content.',
          user_id: 'test-user-id',
        }));
      });
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: 'Plan Saved' }));
    });

  });

  // Add more tests for error states, rate limiting, etc.

});
