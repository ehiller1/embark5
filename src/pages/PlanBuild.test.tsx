/// <reference types="@testing-library/jest-dom" />
// src/pages/PlanBuild.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PlanBuilder } from './PlanBuild';
import { AuthContext, AuthContextType } from '@/components/AuthContext';
// import { ToastProvider } from '@/components/ui/toast/toast-provider'; // Path incorrect, needs verification // Assuming this is how your ToastProvider is set up

// --- Mocks --- 

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
const mockUseAuth = (user = { id: 'test-user-id', email: 'test@example.com' }) => ({
  user,
  session: { user } as any, // Adjust as per your session structure
  isAuthenticated: !!user,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
  signup: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  updateUserPassword: vi.fn(),
});

// Mock Supabase
const mockSupabaseFrom = vi.fn().mockReturnThis();
const mockSupabaseSelect = vi.fn().mockReturnThis();
const mockSupabaseEq = vi.fn().mockReturnThis();
const mockSupabaseIn = vi.fn().mockResolvedValue({ data: [], error: null });
const mockSupabaseInsert = vi.fn().mockResolvedValue({ data: [{}], error: null });

vi.mock('@/integrations/lib/supabase', () => ({
  supabase: {
    from: mockSupabaseFrom,
    // Mock other Supabase client methods if PlanBuilder uses them directly
    // For now, focusing on what's in the provided PlanBuilder code
    // select, eq, in are chained, so 'from' needs to return an object that has them
    // This simplified mock might need expansion based on actual usage patterns
  },
}));

// Mock useOpenAI
const mockGenerateResponse = vi.fn();
const mockGetRateLimitStatus = vi.fn().mockReturnValue({ limited: false, waitTime: 0 });
const mockCancelAllRequests = vi.fn();
vi.mock('@/hooks/useOpenAI', () => ({
  useOpenAI: () => ({
    generateResponse: mockGenerateResponse,
    getRateLimitStatus: mockGetRateLimitStatus,
    cancelAllRequests: mockCancelAllRequests,
  }),
}));

// Mock usePrompts
const mockGetPromptByType = vi.fn();
vi.mock('@/hooks/usePrompts', () => ({
  usePrompts: () => ({
    getPromptByType: mockGetPromptByType,
  }),
}));

// Mock useToast
const mockToast = vi.fn();
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
const renderWithProviders = (ui: React.ReactElement, { authValue = mockUseAuth(), route = '/plan_build' } = {}) => {
  return render(
    <AuthContext.Provider value={authValue as unknown as AuthContextType}>
      {/* <ToastProvider> Ensure your app's ToastProvider is here </ToastProvider> */}
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/plan_build" element={ui} />
            <Route path="/community_research" element={<div>Community Research Page</div>} />
          </Routes>
        </MemoryRouter>
      {/* </ToastProvider> */}
    </AuthContext.Provider>
  );
};

// --- Test Suites --- 
describe('PlanBuilder Component', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Clear localStorage mock
    localStorageMock.clear();

    // Reset Supabase mock implementations for chained calls
    // These mocks are defined globally (e.g., const mockSupabaseSelect = vi.fn();)
    // and their chained behavior is set up here for each test.
    mockSupabaseFrom.mockReturnValue({ 
      select: mockSupabaseSelect,
      insert: mockSupabaseInsert,
    } as any);
    mockSupabaseSelect.mockReturnValue({ 
      eq: mockSupabaseEq,
      in: mockSupabaseIn,
      // Add other chained methods if used, e.g., order, limit
    } as any);
    mockSupabaseEq.mockReturnValue({ 
      in: mockSupabaseIn, 
      // Add other chained methods if used, e.g., single, maybeSingle
      // If .eq() can be terminal (i.e., directly awaited):
      then: (callback: any) => callback({ data: null, error: null }) // Default empty response
    } as any);
    mockSupabaseIn.mockResolvedValue({ data: [], error: null }); // Default empty successful response for .in()
    mockSupabaseInsert.mockResolvedValue({ data: [{}], error: null }); // Default successful insert

    // Reset other mocks
    mockUseAuth.mockReturnValue({
      user: { id: 'test-user-id', email: 'test@example.com' },
      isAuthenticated: true,
      session: { access_token: 'test-access-token', user: { id: 'test-user-id' } } as any,
      // Add other auth context values/functions if your component uses them
    });
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
