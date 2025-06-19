import React, { useEffect, useState } from 'react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/MainLayout';
import { useCardStates } from '@/hooks/useCardStates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  BarChart3, 
  Book, 
  Compass, 
  GitBranch, 
  PenTool, 
  ArrowRight,
  CheckCircle,
  ChevronRight,
  Eye,
  FileText,
  ChartPie,
  Building,
  FileSearch,
  Briefcase,
  LampDesk,
  Link as LinkIcon
} from 'lucide-react';

// Add JSX namespace for React
declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      // Add other HTML elements as needed
    }
  }
}

// Props for the FlippableCard component
interface CardAction {
  text: string;
  link: string;
  icon?: React.ReactNode;
}

interface FlippableCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  frontContent: string;
  frontAction: CardAction;
  backContent: string;
  backAction: CardAction;
  lastUpdated?: string;
}

const FlippableCard: React.FC<FlippableCardProps> = ({
  title,
  description,
  icon,
  isCompleted,
  frontContent,
  frontAction,
  backContent,
  backAction,
  lastUpdated
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Determine if the action is disabled (e.g., requirements not met)
  const isDisabled = frontAction.text.includes("First");
  
  // If completed, show flipped state by default
  useEffect(() => {
    setIsFlipped(isCompleted);
  }, [isCompleted]);

  return (
    <div className="relative h-full" onClick={() => {
      if (isCompleted && !isFlipped) {
        // Allow the card to be clicked to view details when completed
        setIsFlipped(true);
      }
    }}>
      <div className="relative w-full h-full">
        {/* Front of Card */}
        <Card 
          className={`hover:shadow-md transition-shadow ${isFlipped ? 'hidden' : 'block'} ${isCompleted ? 'border-gray-300 border-dashed bg-gray-50' : 'border'} h-full`}
        >
          <CardHeader className="mt-6">
            <CardTitle className={`flex items-center gap-2 text-lg ${
              isCompleted 
                ? 'text-gray-500 font-normal' 
                : ''
            }`}>
              {icon}
              {title}
            </CardTitle>
            <CardDescription className={isCompleted ? 'text-gray-400' : ''}>{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className={`text-sm mb-5 ${
              isCompleted 
                ? 'text-gray-500' 
                : ''
            }`}>{frontContent}</p>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between mt-auto">
            {!isCompleted && (
              <span className="text-xs text-muted-foreground">Not started</span>
            )}
            {isCompleted && (
              <span className="text-xs flex items-center gap-1 text-emerald-700">
                <CheckCircle className="h-3 w-3" /> Completed
              </span>
            )}
            <div className="flex gap-2">
              {isCompleted && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 rounded-full" 
                  onClick={() => setIsFlipped(true)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              {isDisabled ? (
                <Button size="sm" className="gap-1" disabled>
                  {frontAction.text} {frontAction.icon}
                </Button>
              ) : (
                <Button size="sm" asChild className="gap-1">
                  <Link to={frontAction.link}>
                    {frontAction.text} {frontAction.icon}
                  </Link>
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
        
        {/* Back of Card */}
        <Card 
          className={`hover:shadow-md transition-shadow ${isFlipped ? 'block' : 'hidden'} border border-gray-300 bg-gray-50 h-full`}
        >
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              Completed
            </Badge>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-gray-500 font-normal">
              {icon}
              {title}
            </CardTitle>
            <CardDescription className="text-gray-400">{description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm mb-5 text-gray-500">{backContent}</p>
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">Last updated: {lastUpdated}</span>
            )}
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="size-8 rounded-full" 
                onClick={() => setIsFlipped(false)}
              >
                <ChevronRight className="h-4 w-4 rotate-180" />
              </Button>
              <Button variant="outline" size="sm" asChild className="gap-1">
                <Link to={backAction.link}>
                  {backAction.text} {backAction.icon}
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

const ClergyHomePage = () => {
  console.log('[ClergyHomePage] Component rendering');
  
  // Get auth state
    const { user, session, loading: authLoading } = useAuth();
  const isAuthenticated = !!session;
  // Get profile state
  const { profile, isLoading: profileLoading } = useUserProfile();
  
  // Local state
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userName, setUserName] = useState<string>('there');
  const [error, setError] = useState<Error | null>(null);
  
  // Log initial state for debugging
  useEffect(() => {
    console.log('[ClergyHomePage] Auth state:', { 
      isAuthenticated,
      authLoading,
      hasUser: !!user, 
      userId: user?.id,
      profileLoading,
      hasProfile: !!profile,
      profileRole: profile?.role
    });
  }, [isAuthenticated, authLoading, user, profileLoading, profile]);
  
  // Log local state
  console.log('[ClergyHomePage] Local state:', { isLoading, userName });
  // Card states are managed by the useCardStates hook
  const { cardStates: cardStatesFromHook } = useCardStates();
  
  // Map the card states from useCardStates to the expected card keys
  const cardStates: Record<string, boolean> = {
    churchProfile: cardStatesFromHook.churchProfile,
    resourceLibrary: cardStatesFromHook.resourceLibrary || false,
    churchResearch: cardStatesFromHook.churchResearch,
    churchAssessment: cardStatesFromHook.churchAssessment,
    communityResearch: cardStatesFromHook.communityResearch,
    communityAssessment: cardStatesFromHook.communityAssessment,
    researchSummary: cardStatesFromHook.researchSummary,
    vocationalStatement: cardStatesFromHook.vocationalStatement,
    scenario: cardStatesFromHook.scenario,
    surveySummary: cardStatesFromHook.surveySummary || false,
    scenarioBuilding: cardStatesFromHook.scenarioBuilding || false,
    implementationTesting: cardStatesFromHook.implementationTesting || false,
    discernmentPlan: cardStatesFromHook.discernmentPlan || false,
    ministryInsights: cardStatesFromHook.ministryInsights || false
  };
  
  // Log which cards are marked as completed
  console.log('[ClergyHomePage] Card states:', cardStates);
  
  const userRole = profile?.role || 'Clergy';
  
  // Toggle card state function (kept for backward compatibility)
  const toggleCardState = (cardKey: string) => {
    // This is a no-op now since state is managed by the useCardStates hook
    // We keep the function for backward compatibility with the UI
    console.log(`Card state toggled: ${cardKey}`);
  };
  
  // Handle user name extraction and profile data
  useEffect(() => {
    try {
      console.log('[ClergyHomePage] useEffect - user profile effect running', { 
        user, 
        hasProfile: !!profile,
        isAuthenticated,
        authLoading,
        profileLoading
      });
      
      // Skip if still loading
      if (authLoading || profileLoading) {
        console.log('[ClergyHomePage] Still loading auth or profile, skipping...');
        return;
      }
      
      // Update loading state
      const newLoadingState = authLoading || profileLoading;
      setIsLoading(newLoadingState);
      
      // Handle unauthenticated state
      if (!isAuthenticated || !user) {
        console.log('[ClergyHomePage] No authenticated user');
        setIsLoading(false);
        return;
      }
      
      // Extract user name
      const extractUserName = () => {
        if (!user) return 'there';
        
        try {
          // From profile
          if (profile?.name) {
            return profile.name.split(' ')[0];
          }
          
          // From auth metadata
          if (user?.user_metadata?.full_name) {
            return user.user_metadata.full_name.split(' ')[0];
          }
          
          // From email
          if (user?.email) {
            const emailName = user.email.split('@')[0];
            return emailName.charAt(0).toUpperCase() + emailName.slice(1);
          }
          
          return 'there';
        } catch (err) {
          console.error('Error extracting user name:', err);
          return 'there';
        }
      };
      
      const name = extractUserName();
      setUserName(name);
      setIsLoading(false);
      setError(null);
      
      // Log user data for debugging
      console.log('[ClergyHomePage] User data:', { 
        hasUser: !!user, 
        userId: user?.id,
        userEmail: user?.email,
        hasProfile: !!profile,
        finalUserName: name,
        profileRole: profile?.role
      });
    } catch (err) {
      console.error('[ClergyHomePage] Error in profile effect:', err);
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
    } finally {
      // Mark loading as complete
      setIsLoading(false);
    }
  }, [user, profile, isAuthenticated, authLoading, profileLoading]);

  // Initialize card states
  useEffect(() => {
    console.log('[ClergyHomePage] Initializing card states');
    // Card states are now managed by the useCardStates hook
  }, []);

  // Show error boundary if there's an error
  if (error) {
    console.error('[ClergyHomePage] Rendering error state:', error);
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="mb-6">We're having trouble loading your dashboard. Please try refreshing the page.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Refresh Page
          </Button>
          <div className="mt-4 p-4 bg-red-50 rounded text-sm text-left max-w-md">
            <p className="font-semibold">Error details:</p>
            <p className="text-red-700">{error.message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show loading state
  if (isLoading) {
    console.log('[ClergyHomePage] Rendering loading state');
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <div className="ml-4">Loading your dashboard...</div>
        </div>
      </MainLayout>
    );
  }
  
  if (!user) {
    console.log('[ClergyHomePage] No authenticated user, showing sign-in prompt');
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
          <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
          <p className="mb-6">You need to be signed in to access the clergy dashboard.</p>
          <Button asChild>
            <Link to="/signin">Sign In</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  console.log('[ClergyHomePage] Rendering main content', { userName, userRole, cardStates });

  console.log('[ClergyHomePage] Rendering JSX');
  return (
    <MainLayout data-testid="clergy-home-layout">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, Rev. {userName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'Clergy' ? 'Manage your church discernment journey' : 'Support your congregation through discernment'}
          </p>
          <h2 className="text-lg font-semibold">Your Progress</h2>
          <span className="text-sm text-muted-foreground">
            {Object.values(cardStates).filter(Boolean).length} of {Object.values(cardStates).length} steps completed
          </span>
        </div>
        <Progress 
          value={(Object.values(cardStates).filter(Boolean).length / Object.values(cardStates).length) * 100} 
          className="h-2" 
        />

        <div className="space-y-8">
          {/* Phase 1: Understanding Your Church */}
          <section className="space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">
                Understanding Your Church
              </h2>
              <p className="text-sm text-muted-foreground">Gather and analyze information about your congregation</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1: Church Profile */}
              <div onClick={() => toggleCardState('churchProfile')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">1</div>
                <FlippableCard 
                  title="Congregational Profile"
                  description="Profile your church communit"
                  icon={<Building className="h-4 w-4 text-primary" />}
                  isCompleted={cardStates.churchProfile}
                  frontContent="Document your church community's demographics, characteristics, and current state."
                  frontAction={{
                    text: cardStates.churchProfile ? "View Profile" : "Create Profile",
                    link: "/community-profile",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've documented your church community's profile and characteristics."
                  backAction={{
                    text: "View Profile",
                    link: "/community-profile",
                    icon: <Eye className="h-3 w-3" />
                  }}
                  lastUpdated="June 11, 2025"
                />
              </div>
              
              {/* Step 2: Survey Summary */}
              <div onClick={() => toggleCardState('surveySummary')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">2</div>
                <FlippableCard 
                  title="Survey Summary"
                  description="Summarize congregation input"
                  icon={<BarChart3 className="h-4 w-4 text-primary" />}
                  isCompleted={cardStates.surveySummary}
                  frontContent={cardStates.churchProfile ? 
                    "Summarize and analyze input received from your congregation members." : 
                    "You must complete your church profile before accessing survey summary."}
                  frontAction={{
                    text: cardStates.churchProfile ? (cardStates.surveySummary ? "View Summary" : "Start Survey") : "Complete Profile First",
                    link: cardStates.churchProfile ? "/survey-summary" : "/community-profile",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've summarized the input received from your congregation."
                  backAction={{
                    text: "View Summary",
                    link: "/survey-summary",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border w-full"></div>

          {/* Phase 2: Knowing Your Community */}
          <section className="space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">
                Knowing Your Community
              </h2>
              <p className="text-sm text-muted-foreground">Research and assess your surrounding community context</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 3: Community Research */}
              <div onClick={() => toggleCardState('communityResearch')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">3</div>
                <FlippableCard 
                  title="Community Research"
                  description="Research your neighborhood context"
                  icon={<FileSearch className="h-4 w-4 text-primary" />}
                  isCompleted={cardStates.communityResearch}
                  frontContent={cardStates.surveySummary ? 
                    "Research demographic and contextual data about your surrounding community." : 
                    "You must complete your survey summary before starting community research."}
                  frontAction={{
                    text: cardStates.surveySummary ? (cardStates.communityResearch ? "View Research" : "Start Research") : "Complete Survey First",
                    link: cardStates.surveySummary ? "/community_research" : "/survey-summary",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've gathered research about your surrounding community context."
                  backAction={{
                    text: "View Research",
                    link: "/community_research",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
              
              {/* Step 4: Community Assessment */}
              <div onClick={() => toggleCardState('communityAssessment')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">4</div>
                <FlippableCard 
                  title="Community Assessment"
                  description="Assess your community's needs"
                  icon={<ChartPie className="h-4 w-4 text-primary" />}
                  isCompleted={cardStates.communityAssessment}
                  frontContent={cardStates.communityResearch ? 
                    "Assess your community's needs and identify key areas for ministry opportunity." : 
                    "You must complete your community research before performing assessment."}
                  frontAction={{
                    text: cardStates.communityResearch ? (cardStates.communityAssessment ? "View Assessment" : "Start Assessment") : "Complete Research First",
                    link: cardStates.communityResearch ? "/community_assessment" : "/community_research",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've assessed your community's needs and identified ministry opportunities."
                  backAction={{
                    text: "View Assessment",
                    link: "/community_assessment",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border w-full"></div>

          {/* Phase 3: Church Research and Assessment */}
          <section className="space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">
                Church Research and Assessment
              </h2>
              <p className="text-sm text-muted-foreground">Analyze your church's context and capacity</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 5: Church Research */}
              <div onClick={() => toggleCardState('churchResearch')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">5</div>
                <FlippableCard 
                  title="Church Research"
                  description="Research your church context"
                  icon={<BookOpen className="h-4 w-4 text-primary" />}
                  isCompleted={cardStates.churchResearch}
                  frontContent={cardStates.communityAssessment ? 
                    "Research your church's history, current strengths and opportunities." : 
                    "You must complete your community assessment before starting church research."}
                  frontAction={{
                    text: cardStates.communityAssessment ? (cardStates.churchResearch ? "View Research" : "Start Research") : "Complete Assessment First",
                    link: cardStates.communityAssessment ? "/church_research" : "/community_assessment",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've researched your church's context and identified key characteristics."
                  backAction={{
                    text: "View Research",
                    link: "/church_research",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
              
              {/* Step 6: Church Assessment */}
              <div onClick={() => toggleCardState('churchAssessment')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">6</div>
                <FlippableCard 
                  title="Church Assessment"
                  description="Assess your church's capacity"
                  icon={<Users className="h-4 w-4 text-primary" />}
                  isCompleted={cardStates.churchAssessment}
                  frontContent={cardStates.churchResearch ? 
                    "Assess your church's strengths, weaknesses, and ministry capacity." : 
                    "You must complete your church research before assessing capacity."}
                  frontAction={{
                    text: cardStates.churchResearch ? (cardStates.churchAssessment ? "View Assessment" : "Start Assessment") : "Complete Research First",
                    link: cardStates.churchResearch ? "/church_assessment" : "/church_research",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've assessed your church's capacity and ministry potential."
                  backAction={{
                    text: "View Assessment",
                    link: "/church_assessment",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border w-full"></div>

          {/* Phase 4-6 */}
          <section className="space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">
                Discernment and Planning
              </h2>
              <p className="text-sm text-muted-foreground">Synthesize research, define your church's vocation, and create a discernment plan</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Step 7: Research Summary */}
              <div onClick={() => toggleCardState('researchSummary')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">7</div>
                <FlippableCard 
                  title="Research Summary"
                  description="Synthesize research findings"
                  icon={<FileText className="h-5 w-5 text-primary" />}
                  isCompleted={cardStates.researchSummary}
                  frontContent={cardStates.churchAssessment ? 
                    "Synthesize all research findings into a comprehensive summary." : 
                    "You must complete your church assessment before synthesizing research."}
                  frontAction={{
                    text: cardStates.churchAssessment ? "Create Summary" : "Complete Assessment First",
                    link: cardStates.churchAssessment ? "/ResearchSummary" : "/church_assessment",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've synthesized your research findings into a comprehensive summary."
                  backAction={{
                    text: "View Research Summary",
                    link: "/ResearchSummary",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
              
              {/* Step 8: Vocational Statement */}
              <div onClick={() => toggleCardState('vocationalStatement')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">8</div>
                <FlippableCard 
                  title="Your Mission or Vocation"
                  description="Define your church's calling"
                  icon={<Compass className="h-5 w-5 text-primary" />}
                  isCompleted={cardStates.vocationalStatement}
                  frontContent={cardStates.researchSummary ? 
                    "Define your church's unique calling and vocational direction." : 
                    "You must complete your research summary before defining vocational statement."}
                  frontAction={{
                    text: cardStates.researchSummary ? "Create Statement" : "Complete Summary First",
                    link: cardStates.researchSummary ? "/conversation" : "/ResearchSummary",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've defined your church's unique calling and vocational direction."
                  backAction={{
                    text: "View Vocational Statement",
                    link: "/conversation",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
              
              {/* Step 9: Scenario Building */}
              <div onClick={() => toggleCardState('scenarioBuilding')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">9</div>
                <FlippableCard 
                  title="Scenario Building"
                  description="Create future ministry scenarios"
                  icon={<GitBranch className="h-5 w-5 text-primary" />}
                  isCompleted={cardStates.scenarioBuilding}
                  frontContent={cardStates.vocationalStatement ? 
                    "Create and explore possible future ministry scenarios for your church." : 
                    "You must complete your vocational statement before building scenarios."}
                  frontAction={{
                    text: cardStates.vocationalStatement ? "Build Scenarios" : "Complete Vocational Statement First",
                    link: cardStates.vocationalStatement ? "/scenario" : "/conversation",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've created and explored possible future ministry scenarios for your church."
                  backAction={{
                    text: "View Scenarios",
                    link: "/scenario",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border w-full"></div>

          {/* Phase 7-8 */}
          <section className="space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">
                Implementation and Testing
              </h2>
              <p className="text-sm text-muted-foreground">Create a discernment plan and test its implementation</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Step 10: Discernment Plan */}
              <div onClick={() => toggleCardState('discernmentPlan')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">10</div>
                <FlippableCard 
                  title="Planning the Discernment Process"
                  description="Create your strategic plan"
                  icon={<PenTool className="h-5 w-5 text-primary" />}
                  isCompleted={cardStates.discernmentPlan}
                  frontContent={cardStates.scenarioBuilding ? 
                    "Develop a strategic discernment plan based on your scenarios and vocational calling." : 
                    "You must complete scenario building before creating a discernment plan."}
                  frontAction={{
                    text: cardStates.scenarioBuilding ? "Create Plan" : "Complete Scenarios First",
                    link: cardStates.scenarioBuilding ? "/plan_build" : "/scenario",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've developed a strategic discernment plan for your church's future ministry."
                  backAction={{
                    text: "View Plan",
                    link: "/plan_build",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
              
              {/* Step 11: Implementation Testing */}
              <div onClick={() => toggleCardState('implementationTesting')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">11</div>
                <FlippableCard 
                  title="Engaging the Parish"
                  description="Test your ministry plan"
                  icon={<Briefcase className="h-5 w-5 text-primary" />}
                  isCompleted={cardStates.implementationTesting}
                  frontContent={cardStates.discernmentPlan ? 
                    "Test your discernment plan with small-scale implementation and gather feedback." : 
                    "You must complete your discernment plan before testing implementation."}
                  frontAction={{
                    text: cardStates.discernmentPlan ? "Start Testing" : "Complete Plan First",
                    link: cardStates.discernmentPlan ? "/implementation" : "/plan_build",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've tested elements of your plan and gathered valuable implementation feedback."
                  backAction={{
                    text: "View Test Results",
                    link: "/implementation",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-border w-full"></div>

          {/* Resources */}
          <section className="space-y-4">
            <div className="mb-2">
              <h2 className="text-xl font-semibold">
                Supporting Materials
              </h2>
              <p className="text-sm text-muted-foreground">Access guides and resources for your journey</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Step 12: Resource Library */}
              <div onClick={() => toggleCardState('resourceLibrary')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">12</div>
                <FlippableCard 
                  title="Resource Library"
                  description="Guides, templates, and articles"
                  icon={<Book className="h-5 w-5 text-primary" />}
                  isCompleted={cardStates.resourceLibrary}
                  frontContent="Access materials and templates to support your church's discernment process."
                  frontAction={{
                    text: "Browse Resources",
                    link: "/resource-library",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've accessed the resource library for guidance and templates."
                  backAction={{
                    text: "View Resources",
                    link: "/resource-library",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
              
              {/* Step 13: Ministry Insights */}
              <div onClick={() => toggleCardState('ministryInsights')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">13</div>
                <FlippableCard 
                  title="Ministry Insights"
                  description="Best practices and innovations"
                  icon={<LampDesk className="h-5 w-5 text-primary" />}
                  isCompleted={cardStates.ministryInsights}
                  frontContent="Explore ministry insights, innovations and best practices from church leaders."
                  frontAction={{
                    text: "Explore Insights",
                    link: "/ministry-ideas",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've explored ministry insights and best practices for your context."
                  backAction={{
                    text: "View Insights",
                    link: "/ministry-ideas",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
              
              {/* Step 14: Connect with Churches */}
              <div onClick={() => toggleCardState('connectWithChurches')} className="relative group">
                <div className="absolute -left-2 top-0 h-full w-1 bg-primary rounded-r opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute top-2 left-2 z-10 flex items-center justify-center w-7 h-7 rounded-full bg-primary text-white text-base font-medium">14</div>
                <FlippableCard 
                  title="Connect with Churches"
                  description="Network and collaborate with other churches"
                  icon={<LinkIcon className="h-5 w-5 text-primary" />}
                  isCompleted={cardStates.connectWithChurches}
                  frontContent="Connect with other churches, share experiences, and collaborate on ministry initiatives."
                  frontAction={{
                    text: "Connect Now",
                    link: "/connect",
                    icon: <ArrowRight className="h-3 w-3" />
                  }}
                  backContent="You've connected with other churches and explored collaboration opportunities."
                  backAction={{
                    text: "View Connections",
                    link: "/connect",
                    icon: <Eye className="h-3 w-3" />
                  }}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClergyHomePage;