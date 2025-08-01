/// <reference types="@testing-library/jest-dom" />
// src/pages/PlanBuild.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
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
  // Create a mock implementation for the Supabase query builder
  const createQueryBuilder = () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      abortSignal: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
    };
    
    // Default implementation for the query chain
    builder.select.mockImplementation(() => builder);
    builder.eq.mockImplementation(() => builder);
    builder.in.mockImplementation(() => Promise.resolve({ data: [], error: null }));
    
    return builder;
  };

  // Mock the Supabase client
  const mockSupabaseClient = {
    from: vi.fn().mockImplementation(() => createQueryBuilder()),
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Clear localStorage mock
    localStorageMock.clear();

    // Set up default mock implementations
    vi.mocked(supabase.from).mockImplementation(mockSupabaseClient.from);
    
    // Set up auth mock
    mockedUseAuth.mockReturnValue(createMockAuth());

    // Set up default mocks
    mockEnhancePlan.mockResolvedValue('Enhanced plan content.');
    mockGetPromptByType.mockResolvedValue({ 
      success: true, 
      data: { prompt: 'Test prompt for $(vocational_statement) and $(scenario_details) and $(selected_scenarios)' }
    });
    mockGeneratePlan.mockResolvedValue('Generated plan content.');
    mockToast.mockClear();
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
    // Test data
    const mockResearchSummary = 'Test research summary';
    const mockVocationalStatement = { 
      id: 'vs1', 
      statement: 'Test vocational statement', 
      name: 'Test Name', 
      createdAt: new Date().toISOString() 
    };
    const mockScenarioDetails = { 
      id: 'sc1', 
      title: 'Test Scenario', 
      description: 'Test scenario description' 
    };
    const mockScenarioDetailsArray = [mockScenarioDetails];

    // Helper function to set up mocks for a test case
    const setupTest = ({
      localStorageData = {},
      dbData = {},
      error = null,
      generateResponse = { text: 'Generated plan content.', error: null }
    }: {
      localStorageData?: Record<string, any>;
      dbData?: Record<string, any>;
      error?: any;
      generateResponse?: { text: string; error: any };
    } = {}) => {
      // Clear previous mocks and localStorage
      localStorageMock.clear();
      vi.clearAllMocks();

      // Set up localStorage data
      Object.entries(localStorageData).forEach(([key, value]) => {
        localStorageMock.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      });

        // Set up database response for resource_library query
      const mockData = [
        { resource_type: 'research_summary', content: dbData.researchSummary || mockResearchSummary },
        { resource_type: 'vocational_statement', content: dbData.vocationalStatement || mockVocationalStatement },
        { resource_type: 'scenario_details', content: dbData.scenarioDetails || mockScenarioDetailsArray }
      ].filter(Boolean);
      
      // Set up the mock chain for this specific test
      const mockQuery = createQueryBuilder();
      mockQuery.in.mockResolvedValueOnce({
        data: mockData,
        error
      });
      mockSupabaseClient.from.mockReturnValueOnce(mockQuery);

      // Mock getPromptByType to return a valid prompt template
      mockGetPromptByType.mockResolvedValue({
        success: true,
        data: {
          prompt: 'Generate a plan with the following details: [VOCATIONAL_STATEMENT] [SCENARIO_DETAILS] [SELECTED_SCENARIOS]',
          variables: ['VOCATIONAL_STATEMENT', 'SCENARIO_DETAILS', 'SELECTED_SCENARIOS']
        }
      });
      
      // Mock the generateResponse function
      mockGenerateResponse.mockResolvedValue({
        text: generateResponse.text || 'Generated plan content.',
        error: generateResponse.error || null
      });
      
      // Mock the auth user
      mockedUseAuth.mockReturnValue(createMockAuth());
      
      // Return the test data for assertions
      return {
        researchSummary: dbData.researchSummary || mockResearchSummary,
        vocationalStatement: dbData.vocationalStatement || mockVocationalStatement,
        scenarioDetails: dbData.scenarioDetails || [mockScenarioDetails]
      };
    };

    // Test cases for different initialization scenarios
    describe('Initialization Scenarios', () => {
      afterEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
      });
      
      it('should handle missing prerequisites', async () => {
        // No data in localStorage or database
        localStorageMock.clear();
        mockSupabaseIn.mockResolvedValueOnce({ data: [], error: null });
        
        renderWithProviders(<PlanBuilder open={true} />);
        
        await waitFor(() => {
          expect(screen.getByText('Prerequisites Required')).toBeInTheDocument();
          expect(screen.getByText('Research on Community (Summary saved)')).toBeInTheDocument();
          expect(screen.getByText('Start Prerequisite Steps')).toBeInTheDocument();
        });
      });
      
      it('should handle plan generation errors', async () => {
        const errorMessage = 'Failed to generate plan';
        const testData = setupTest({
          localStorageData: {
            research_summary: mockResearchSummary,
            vocational_statement: mockVocationalStatement,
            scenario_details: [mockScenarioDetails]
          },
          generateResponse: {
            text: '',
            error: new Error(errorMessage)
          }
        });

        renderWithProviders(<PlanBuilder open={true} />);
        
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Error generating plan',
              description: errorMessage,
              variant: 'destructive'
            })
          );
        });
      });
      
      it('should handle rate limiting', async () => {
        const testData = setupTest({
          localStorageData: {
            research_summary: mockResearchSummary,
            vocational_statement: mockVocationalStatement,
            scenario_details: [mockScenarioDetails]
          },
          generateResponse: {
            text: '',
            error: { status: 429, message: 'Rate limit exceeded' }
          }
        });

        renderWithProviders(<PlanBuilder open={true} />);
        
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Rate limit exceeded',
              description: 'Please wait before generating another plan.',
              variant: 'destructive'
            })
          );
        });
      });
      it('should handle database errors gracefully', async () => {
        // Set up with an error
        const error = new Error('Database error');
        const testData = setupTest({
          error,
          localStorageData: {
            research_summary: mockResearchSummary
            // Missing other data to trigger DB fetch
          }
        });

        renderWithProviders(<PlanBuilder open={true} />);
        
        await waitFor(() => {
          expect(screen.getByText('Discernment Plan')).toBeInTheDocument();
          // Should show error toast
          expect(mockToast).toHaveBeenCalledWith({
            title: 'Error fetching prerequisites',
            description: 'Database error',
            variant: 'destructive'
          });
        });

        // Should not generate plan if prerequisites aren't met
        expect(mockGenerateResponse).not.toHaveBeenCalled();
      });  

      it('should load all data from localStorage when available', async () => {
        const testData = setupTest({
          localStorageData: {
            research_summary: mockResearchSummary,
            vocational_statement: mockVocationalStatement,
            scenario_details: [mockScenarioDetails]
          }
        });

        renderWithProviders(<PlanBuilder open={true} />);
        
        await waitFor(() => {
          expect(screen.getByText('Discernment Plan')).toBeInTheDocument();
        });

        // Verify database wasn't queried since all data was in localStorage
        expect(supabase.from).not.toHaveBeenCalled();
        
        // Verify plan generation was triggered
        await waitFor(() => {
          expect(mockGenerateResponse).toHaveBeenCalled();
        });
      });

      it('should fetch missing data from database when localStorage is incomplete', async () => {
        const testData = setupTest({
          localStorageData: {
            research_summary: mockResearchSummary
            // Missing vocational_statement and scenario_details
          },
          dbData: {
            // These will be fetched from the database
            vocationalStatement: mockVocationalStatement,
            scenarioDetails: [mockScenarioDetails]
          }
        });

        renderWithProviders(<PlanBuilder open={true} />);
        
        await waitFor(() => {
          expect(screen.getByText('Discernment Plan')).toBeInTheDocument();
        });

        // Verify database was queried for missing data
        expect(supabase.from).toHaveBeenCalled();
        
        // Verify plan generation was triggered
        await waitFor(() => {
          expect(mockGenerateResponse).toHaveBeenCalled();
        });
      });

      it('should handle malformed JSON in localStorage gracefully', async () => {
        // Set up localStorage with malformed JSON
        localStorageMock.setItem('research_summary', 'invalid-json');
        localStorageMock.setItem('vocational_statement', 'invalid-json');
        localStorageMock.setItem('scenario_details', 'invalid-json');

        // Mock database to return valid data
        const testData = setupTest({
          dbData: {
            researchSummary: mockResearchSummary,
            vocationalStatement: mockVocationalStatement,
            scenarioDetails: [mockScenarioDetails]
          }
        });

        renderWithProviders(<PlanBuilder open={true} />);
        
        await waitFor(() => {
          expect(screen.getByText('Discernment Plan')).toBeInTheDocument();
        });

        // Should fall back to database for malformed JSON
        expect(supabase.from).toHaveBeenCalled();
        
        // Verify plan generation was triggered
        await waitFor(() => {
          expect(mockGenerateResponse).toHaveBeenCalled();
        });
      });

      it('should handle database errors gracefully', async () => {
        const errorMessage = 'Database connection failed';
        setupTest({
          localStorageData: {
            research_summary: mockResearchSummary
          },
          error: { message: errorMessage }
        });

        renderWithProviders(<PlanBuilder open={true} />);
        
        // Should show error toast
        await waitFor(() => {
          expect(mockToast).toHaveBeenCalledWith(
            expect.objectContaining({
              title: 'Error fetching prerequisites',
              description: errorMessage,
              variant: 'destructive'
            })
          );
        });
      });

      it('should handle empty scenario array from database', async () => {
        setupTest({
          localStorageData: {
            research_summary: mockResearchSummary,
            vocational_statement: mockVocationalStatement
            // Missing scenarios
          },
          dbData: {
            scenarioDetails: [] // Empty array from database
          }
        });

        renderWithProviders(<PlanBuilder open={true} />);
        
        // Should show prerequisites not met because scenarios array is empty
        await waitFor(() => {
          expect(screen.getByText('Prerequisites Required')).toBeInTheDocument();
        });
      });
    });

    // Existing test with beforeEach moved inside the describe block
    it('should display plan generation UI and auto-generate plan if all prerequisites in localStorage', async () => {
      // Set up with all prerequisites in localStorage
      const testData = setupTest({
        localStorageData: {
          research_summary: mockResearchSummary,
          vocational_statement: mockVocationalStatement,
          scenario_details: [mockScenarioDetails]
        },
        generateResponse: {
          text: 'Generated plan content.',
          error: null
        }
      });

      renderWithProviders(<PlanBuilder open={true} />);
      
      // Wait for the plan to be generated
      await waitFor(() => {
        expect(screen.getByText('Discernment Plan')).toBeInTheDocument();
      });

      // Verify plan generation was triggered with the correct prompt
      expect(mockGetPromptByType).toHaveBeenCalled();
      
      // Check that the generated plan is displayed
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

    it('should allow editing the plan and toggling edit mode', async () => {
      const testData = setupTest({
        localStorageData: {
          research_summary: mockResearchSummary,
          vocational_statement: mockVocationalStatement,
          scenario_details: [mockScenarioDetails]
        },
        generateResponse: {
          text: 'Generated plan content.',
          error: null
        }
      });

      renderWithProviders(<PlanBuilder open={true} />);
      
      // Wait for the plan to be generated
      await waitFor(() => {
        expect(screen.getByText('Generated plan content.')).toBeInTheDocument();
      });

      // Click the edit button
      const editButton = screen.getByRole('button', { name: /Edit/i });
      fireEvent.click(editButton);
      
      // Verify edit mode is active
      const textarea = await screen.findByRole('textbox');
      expect(textarea).toBeInTheDocument();
      
      // Edit the plan
      fireEvent.change(textarea, { target: { value: 'Manually edited plan.' } });
      expect(textarea).toHaveValue('Manually edited plan.');
      
      // Click save
      const saveButton = screen.getByRole('button', { name: /Save/i });
      fireEvent.click(saveButton);
      
      // Should exit edit mode
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('should allow enhancing the plan', async () => {
      // Set up the test with all prerequisites in localStorage
      const testData = setupTest({
        localStorageData: {
          research_summary: mockResearchSummary,
          vocational_statement: mockVocationalStatement,
          scenario_details: [mockScenarioDetails]
        },
        generateResponse: {
          text: 'Generated plan content.',
          error: null
        }
      });

      // Mock the enhancement response
      mockGenerateResponse.mockResolvedValueOnce({
        text: 'Enhanced plan content with more details.',
        error: null
      });

      renderWithProviders(<PlanBuilder open={true} />);
      
      // Wait for the initial plan to be generated
      await waitFor(() => {
        expect(screen.getByText('Generated plan content.')).toBeInTheDocument();
      });
      
      // Verify initial state
      expect(screen.getByRole('button', { name: /Enhance/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Plan/i })).toBeInTheDocument();

      // Enter enhancement text and submit
      const enhancementInput = screen.getByPlaceholderText('Suggest an enhancement...');
      fireEvent.change(enhancementInput, { target: { value: 'Make it more detailed' } });
      
      const enhanceButton = screen.getByRole('button', { name: /Enhance/i });
      fireEvent.click(enhancementInput); // Focus the input first
      fireEvent.click(enhanceButton);

      // Verify enhancement was processed
      await waitFor(() => {
        // Check that generateResponse was called with the enhancement prompt
        expect(mockGenerateResponse).toHaveBeenCalledTimes(2);
        
        // Get the last call to generateResponse
        const lastCall = mockGenerateResponse.mock.calls[1][0];
        expect(lastCall).toMatchObject({
          messages: [
            {
              role: 'system',
              content: expect.any(String)
            },
            {
              role: 'user',
              content: expect.stringContaining('Make it more detailed')
            }
          ]
        });
      });
      
      // Check that the enhanced plan is displayed
      await waitFor(() => {
        expect(screen.getByText('Enhanced plan content with more details.')).toBeInTheDocument();
      });
    });

    it('should allow saving the plan', async () => {
      // Set up the test with all prerequisites in localStorage
      const testData = setupTest({
        localStorageData: {
          research_summary: mockResearchSummary,
          vocational_statement: mockVocationalStatement,
          scenario_details: [mockScenarioDetails]
        },
        generateResponse: {
          text: 'Generated plan content.',
          error: null
        }
      });

      // Mock a successful save to Supabase
      const mockInsert = vi.fn().mockResolvedValueOnce({
        data: { id: 'plan-123' },
        error: null
      });
      
      // Mock the Supabase client's from and insert methods
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      });
      
      // Replace the actual supabase client with our mock
      vi.mocked(supabase.from).mockImplementation(mockFrom);
      
      // Clear any previous mock calls
      mockToast.mockClear();

      renderWithProviders(<PlanBuilder open={true} />);
      
      // Wait for the plan to be generated
      await waitFor(() => {
        expect(screen.getByText('Generated plan content.')).toBeInTheDocument();
      });

      // Click the save button to open the dialog
      const saveButton = screen.getByRole('button', { name: /Save Plan/i });
      fireEvent.click(saveButton);
      
      // Confirm the save in the dialog
      const confirmButton = await screen.findByRole('button', { name: /Save Plan/i });
      fireEvent.click(confirmButton);

      // Verify the save was processed
      await waitFor(() => {
        // Verify the insert was called with the correct arguments
        expect(supabase.from).toHaveBeenCalledWith('resource_library');
        
        // Verify the insert method was called with the expected data
        expect(mockInsert).toHaveBeenCalledWith({
          title: expect.stringContaining('Discernment Plan:'),
          content: 'Generated plan content.',
          user_id: 'test-user-id',
          church_id: undefined,
          created_by: 'test-user-id',
          resource_type: 'discernment_plan',
          scenario_title: mockScenarioDetails.title,
          tags: expect.arrayContaining(['discernment', 'plan', mockScenarioDetails.id])
        });
      });
      
      // Verify success toast was shown with the correct title
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Plan Saved'
      });
    });

  });

  // Add more tests for error states, rate limiting, etc.

});
