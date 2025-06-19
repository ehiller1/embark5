import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
// Import our new auth providers
import { AuthProvider } from "@/integrations/lib/auth/AuthProvider";
import { UserProfileProvider } from "@/integrations/lib/auth/UserProfileProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect } from "react";
import { createRequiredPrompts } from "./utils/promptUtils";

// Import all the page components
import Index from "./pages/Index";
import Conversation from "./pages/Conversation";
import CommunityAssessment from "./pages/CommunityAssessment";
import CommunityResearch from "./pages/CommunityResearch";
import ChurchAssessment from "./pages/ChurchAssessment";
import ChurchResearch from "./pages/ChurchResearch";
import ResearchSummary from "./pages/ResearchSummary";


import Scenario from "./pages/Scenario";
import ScenarioMessaging from "./pages/ScenarioMessaging"; 
import { PlanBuilder as PlanBuild } from "./pages/PlanBuild";
import NarrativeBuild from "./pages/NarrativeBuild";

import Implementation from "./pages/Implementation";
import Connect from "./pages/Connect";
import TestPage from "./pages/TestPage";
import OpenAITestPlan from "./pages/OpenAITestPlan";
import PrayersPage from "./pages/PrayersPage";
import TheologicalResourcesPage from "./pages/TheologicalResourcesPage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import MinistryIdeasPage from "./pages/MinistryIdeasPage";
import ResourceLibraryPage from "./pages/ResourceLibraryPage";
import SpiritualGuidesPage from "./pages/SpiritualGuidesPage";
import NotFound from "./pages/NotFound";
import ModuleExplanation from "./pages/ModuleExplanation";
import ClergyHomePage from "./pages/ClergyHomePage"; 
import ParishHomePage from "./pages/ParishHomePage";
import CommunityProfilePage from "./pages/CommunityProfilePage";
import SerpApiTest from './pages/SerpApiTest';
// Import Parish-specific components
import ConversationParishSurvey from './pages/Conversation_parish_survey';
import CrowdfundingMarketplace from './pages/CrowdfundingMarketplace';
import ConversationParish from './pages/Conversation_parish';
import SurveySummary from './pages/survey_summary';
import MinistryDetail from './pages/MinistryDetail';
import InvestmentSuccess from './pages/InvestmentSuccess';
// If InvestmentDashboard exists, import it. Otherwise, create a placeholder for now.
import InvestmentDashboard from './pages/InvestmentDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const RouteDebugger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log("Current route:", location.pathname);
    console.log("Route params:", location.search);
    console.log("Route state:", location.state);
  }, [location]);
  
  return null; // This component doesn't render anything
};

const App = () => {
  useEffect(() => {
    console.log("App component mounted - ensuring prompts exist");
    const initPrompts = async () => {
      try {
        const result = await createRequiredPrompts();
        console.log("Prompt initialization result:", result);
      } catch (error) {
        console.error("Error initializing prompts:", error);
      }
    };
    
    initPrompts();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <UserProfileProvider>
            <ErrorBoundary>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <RouteDebugger />
                <Routes>
                <Route path="/" element={<Index />} />
                <Route 
                  path="/clergy-home" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ClergyHomePage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/parish-home" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ParishHomePage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/conversation" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Conversation />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/community_assessment" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CommunityAssessment />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/community_research" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CommunityResearch />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/church_assessment" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ChurchAssessment />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/church_research" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ChurchResearch />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ResearchSummary" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ResearchSummary />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/scenario" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Scenario />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/scenario_messaging" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ScenarioMessaging />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/plan_build" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <PlanBuild />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/test" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <TestPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/openai-test-plan" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <OpenAITestPlan />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/prayers" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <PrayersPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/theological-resources" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <TheologicalResourcesPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/case-studies" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CaseStudiesPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/ministry-ideas" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <MinistryIdeasPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/resource-library" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ResourceLibraryPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/connect" 
                  element={
                    <ProtectedRoute allowedRoles={['Clergy', 'Parish']} redirectPath="/">
                      <ErrorBoundary>
                        <Connect />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/spiritual-guides" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <SpiritualGuidesPage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/survey-summary"
                  
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <SurveySummary />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/module-explanation" 
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ModuleExplanation />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  } 
                />
                <Route
                  path="/narrative_build"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <NarrativeBuild />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/implementation"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <Implementation />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/community-profile"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CommunityProfilePage />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route 
                  path="/connect"
                  element={
                    <ProtectedRoute allowedRoles={['Clergy', 'ParishAdmin', 'Parish']}>
                      <ErrorBoundary>
                        <Connect />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                {/* Parish-specific routes */}
                <Route
                  path="/conversation-parish"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ConversationParish />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/conversation-parish-survey"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <ConversationParishSurvey />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/marketplace"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <CrowdfundingMarketplace />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/ministry/:id"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <MinistryDetail />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investment-success"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <InvestmentSuccess />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/investment-dashboard"
                  element={
                    <ProtectedRoute>
                      <ErrorBoundary>
                        <InvestmentDashboard />
                      </ErrorBoundary>
                    </ProtectedRoute>
                  }
                />
                <Route path="/serpapi-test" element={<SerpApiTest />} />
                <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ErrorBoundary>
          </UserProfileProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
