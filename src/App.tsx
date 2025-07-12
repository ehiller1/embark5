import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/integrations/lib/auth/AuthProvider";
import { UserProfileProvider } from "@/integrations/lib/auth/UserProfileProvider";
import { NarrativeAvatarProvider } from "@/hooks/useNarrativeAvatar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { useEffect } from "react";
import { AuthCompanionFlow } from "./components/AuthCompanionFlow";
import { createRequiredPrompts } from "./utils/promptUtils";
import { MainLayout } from "./components/MainLayout";

// Import all the page components
import Index from "./pages/Index";
import Conversation from "./pages/Conversation";
import CommunityAssessment from "./pages/CommunityAssessment.tsx";
import CommunityResearch from "./pages/CommunityResearch";
import ChurchAssessment from "./pages/ChurchAssessment.tsx";
import ChurchResearch from "./pages/ChurchResearch";
import { default as ResearchSummary } from "./pages/ResearchSummary";
import ClergyHomePage from "./pages/ClergyHomePage.tsx";
import ParishHomePage from "./pages/ParishHomePage";
import CommunityProfilePage from "./pages/CommunityProfilePage";
import Scenario from "./pages/Scenario";
import ScenarioMessaging from "./pages/ScenarioMessaging";
import NarrativeBuild from "./pages/NarrativeBuild";
import { PlanBuilder } from "./pages/PlanBuild";
import DiscernmentPlanPage from "./pages/DiscernmentPlanPage";

import PrayersPage from "./pages/PrayersPage";
import TheologicalResourcesPage from "./pages/TheologicalResourcesPage";
import CaseStudiesPage from "./pages/CaseStudiesPage";
import MinistryIdeasPage from "./pages/MinistryIdeasPage";
import ResourceLibraryPage from "./pages/ResourceLibraryPage";
import Connect from "./pages/Connect";
import SpiritualGuidesPage from "./pages/SpiritualGuidesPage";
import ModuleExplanation from "./pages/ModuleExplanation";
import Implementation from "./pages/Implementation";
import SerpApiTest from "./pages/SerpApiTest";
import NotFound from "./pages/NotFound";
import Unauthorized from './pages/Unauthorized';
import TestPage from "./pages/TestPage";
import ConversationParishSurvey from './pages/Conversation_parish_survey';
import CrowdfundingMarketplace from './pages/CrowdfundingMarketplace';
import ConversationParish from './pages/Conversation_parish';
import SurveySummary from './pages/survey_summary';
import SurveyNeighborhoodBuild from './pages/SurveyNeighborhoodBuild';
import NeighborhoodSurvey from './pages/NeighborhoodSurvey';
import MinistryDetail from './pages/MinistryDetail';
import ClergyMarketplace from './pages/ClergyMarketplace';
import ServicesMarketplace from './pages/ServicesMarketplace';
import Accounting from './pages/Accounting';
import InvestmentSuccess from './pages/InvestmentSuccess';
import InvestmentDashboard from './pages/InvestmentDashboard';
import Viability from './pages/Viability';
import VocationalDiscernment from './pages/VocationalDiscernment';
import SurveyBuild from './pages/SurveyBuild';
import ServiceDetail from './pages/ServiceDetail';

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
    console.log(`Current route: ${location.pathname}`);
  }, [location]);
  
  return null;
};

const App = () => {
  useEffect(() => {
    const initPrompts = async () => {
      try {
        await createRequiredPrompts();
      } catch (error) {
        console.error("Error initializing prompts:", error);
      }
    };
    initPrompts();
  }, []);

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <UserProfileProvider>
              <NarrativeAvatarProvider>
                <ErrorBoundary>
                  <Toaster />
                  <Sonner />
                  <AuthCompanionFlow />
                  <RouteDebugger />
                  <Routes>
                    <Route element={<MainLayout />}>
                      {/* Public Routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/test" element={<TestPage />} />
                                            <Route path="/serpapi-test" element={<SerpApiTest />} />
                      <Route path="/unauthorized" element={<Unauthorized />} />

                      {/* Routes requiring any authenticated user */}
                      <Route path="/conversation" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
                      <Route path="/prayers" element={<ProtectedRoute><PrayersPage /></ProtectedRoute>} />
                      <Route path="/theological-resources" element={<ProtectedRoute><TheologicalResourcesPage /></ProtectedRoute>} />
                      <Route path="/case-studies" element={<ProtectedRoute><CaseStudiesPage /></ProtectedRoute>} />
                      <Route path="/ministry-ideas" element={<ProtectedRoute><MinistryIdeasPage /></ProtectedRoute>} />
                      <Route path="/resource-library" element={<ProtectedRoute><ResourceLibraryPage /></ProtectedRoute>} />
                      <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />
                      <Route path="/spiritual-guides" element={<ProtectedRoute><SpiritualGuidesPage /></ProtectedRoute>} />
                      <Route path="/module-explanation" element={<ProtectedRoute><ModuleExplanation /></ProtectedRoute>} />
                      <Route path="/implementation" element={<ProtectedRoute><Implementation /></ProtectedRoute>} />

                      {/* Role-specific home pages */}
                      <Route path="/clergy-home" element={<ProtectedRoute allowedRoles={['Clergy']}><ClergyHomePage /></ProtectedRoute>} />
                      <Route path="/parish-home" element={<ProtectedRoute allowedRoles={['Parish']}><ParishHomePage /></ProtectedRoute>} />

                      {/* Clergy-only routes */}
                      <Route path="/community-assessment" element={<ProtectedRoute allowedRoles={['Clergy']}><CommunityAssessment /></ProtectedRoute>} />
                      <Route path="/community-research" element={<ProtectedRoute allowedRoles={['Clergy']}><CommunityResearch /></ProtectedRoute>} />
                      <Route path="/church-assessment" element={<ProtectedRoute allowedRoles={['Clergy']}><ChurchAssessment /></ProtectedRoute>} />
                      <Route path="/church-research" element={<ProtectedRoute allowedRoles={['Clergy']}><ChurchResearch /></ProtectedRoute>} />
                      <Route path="/accounting" element={<ProtectedRoute allowedRoles={['Clergy']}><Accounting /></ProtectedRoute>} />
                      <Route path="/research-summary" element={<ProtectedRoute allowedRoles={['Clergy']}><ResearchSummary /></ProtectedRoute>} />
                      <Route path="/community-profile" element={<ProtectedRoute allowedRoles={['Clergy']}><CommunityProfilePage /></ProtectedRoute>} />
                      <Route path="/scenario" element={<ProtectedRoute allowedRoles={['Clergy']}><Scenario /></ProtectedRoute>} />
                      <Route path="/scenario-messaging" element={<ProtectedRoute allowedRoles={['Clergy']}><ScenarioMessaging /></ProtectedRoute>} />
                      <Route path="/scenario-messaging/:scenarioId" element={<ProtectedRoute allowedRoles={['Clergy']}><ScenarioMessaging /></ProtectedRoute>} />
                      <Route path="/narrative-build" element={<ProtectedRoute allowedRoles={['Clergy']}><NarrativeBuild /></ProtectedRoute>} />
                      <Route path="/narrative-build/:scenarioId" element={<ProtectedRoute allowedRoles={['Clergy']}><NarrativeBuild /></ProtectedRoute>} />
                      <Route path="/plan-build" element={<ProtectedRoute allowedRoles={['Clergy']}><PlanBuilder /></ProtectedRoute>} />
                      <Route path="/plan-build/:scenarioId" element={<ProtectedRoute allowedRoles={['Clergy']}><PlanBuilder /></ProtectedRoute>} />
                      <Route path="/discernment-plan" element={<ProtectedRoute allowedRoles={['Clergy']}><DiscernmentPlanPage /></ProtectedRoute>} />
                                            
                      <Route path="/viability" element={<Viability />} />
                      <Route path="/vocational-discernment" element={<ProtectedRoute allowedRoles={['Clergy']}><VocationalDiscernment /></ProtectedRoute>} />
                      <Route path="/survey-build" element={<ProtectedRoute allowedRoles={['Clergy']}><SurveyBuild /></ProtectedRoute>} />
                      <Route path="/survey-neighborhood-build" element={<ProtectedRoute allowedRoles={['Clergy']}><SurveyNeighborhoodBuild /></ProtectedRoute>} />
                      <Route path="/neighborhood-survey" element={<ProtectedRoute allowedRoles={['Clergy']}><NeighborhoodSurvey /></ProtectedRoute>} />
                      <Route path="/surveys/:id/summary" element={<ProtectedRoute allowedRoles={['Clergy']}><SurveySummary /></ProtectedRoute>} />

                      {/* Parish-only routes */}
                      <Route path="/conversation-parish-survey" element={<ProtectedRoute allowedRoles={['Parish']}><ConversationParishSurvey /></ProtectedRoute>} />
                      <Route path="/conversation-parish" element={<ProtectedRoute allowedRoles={['Parish']}><ConversationParish /></ProtectedRoute>} />
                                            <Route path="/survey-summary" element={<ProtectedRoute allowedRoles={['Clergy', 'Parish']}><SurveySummary /></ProtectedRoute>} />
                      {/* Clergy Marketplace */}
                      <Route path="/clergy/marketplace" element={<ProtectedRoute allowedRoles={['Clergy']}><ClergyMarketplace /></ProtectedRoute>} />
                      <Route path="/services-marketplace" element={<ProtectedRoute allowedRoles={['Clergy']}><ServicesMarketplace /></ProtectedRoute>} />
                      <Route path="/services/:id" element={<ProtectedRoute allowedRoles={['Clergy']}><ServiceDetail /></ProtectedRoute>} />
                      {/* Parish Marketplace */}
                      <Route path="/marketplace" element={<ProtectedRoute allowedRoles={['Parish']}><CrowdfundingMarketplace /></ProtectedRoute>} />
                      <Route path="/ministry-detail/:ministryId" element={<ProtectedRoute allowedRoles={['Parish']}><MinistryDetail /></ProtectedRoute>} />
                      <Route path="/investment-success" element={<ProtectedRoute allowedRoles={['Parish']}><InvestmentSuccess /></ProtectedRoute>} />
                      <Route path="/investment-dashboard" element={<ProtectedRoute allowedRoles={['Parish']}><InvestmentDashboard /></ProtectedRoute>} />

                      {/* Catch-all for not found routes */}
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </ErrorBoundary>
              </NarrativeAvatarProvider>
            </UserProfileProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
