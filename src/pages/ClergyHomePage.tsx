// src/pages/ClergyHomePage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useUserProfile } from '@/integrations/lib/auth/UserProfileProvider';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useCardStates } from '@/hooks/useCardStates';
import { CompanionSelectionModal } from '@/components/CompanionSelectionModal';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { CircularProgress } from '../components/ui/circular-progress';
import { motion } from 'framer-motion';
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
  FileText,
  ChartPie,
  Building,
  FileSearch,
  Briefcase,
  LampDesk,
  Link as LinkIcon,
} from 'lucide-react';

const PHASES = [
  {
    title: 'Surveying Your Community',
    desc: 'Help us gather and analyze important characteristics of your community.',
    steps: [
      {
        key: 'churchProfile',
        label: 'Create Your Community Profile',
        icon: <Building className="h-5 w-5" />,
        color: ['#E0F2FF', '#3B82F6'],
      },
      {
        key: 'generateSurvey',
        label: 'Generate Your Survey',
        icon: <FileSearch className="h-5 w-5" />,
        color: ['#DDD6FE', '#7C3AED'],
      },
      {
        key: 'surveySummary',
        label: 'Survey Summary',
        icon: <BarChart3 className="h-5 w-5" />,
        color: ['#FCA5A5', '#B91C1C'],
      },
    ],
  },
  {
    title: 'Knowing Your Neighborhood',
    desc: 'Conduct initial research related to your neighborhood. Summarize and analyze gathered data to build a more comprehensive understanding of your opportunities for mission.',
    steps: [
      {
        key: 'communityResearch',
        label: 'Neighborhood Research',
        icon: <Book className="h-5 w-5" />,
        color: ['#FDE68A', '#CA8A04'],
      },
      {
        key: 'communityAssessment',
        label: 'Describing Your Neighborhood',
        icon: <ChartPie className="h-5 w-5" />,
        color: ['#6EE7B7', '#047857'],
      },
      {
        key: 'neighborhoodSurvey',
        label: 'Surveying your Neighborhood',
        icon: <FileText className="h-5 w-5" />,
        color: ['#BFDBFE', '#2563EB'],
        link: '/survey-neighborhood-build'
      },
    ],
  },
  {
    title: 'Researching Your Community',
    desc: "Provide additional information on your community's capacity.",
    steps: [
      {
        key: 'communityResearch',
        label: 'Researching Your Community',
        icon: <BookOpen className="h-5 w-5" />,
        color: ['#FCE7F3', '#DB2777'],
      },
      {
        key: 'churchAssessment',
        label: 'Assessing Your Community',
        icon: <Users className="h-5 w-5" />,
        color: ['#FECACA', '#DC2626'],
      },
    ],
  },
  {
    title: 'Articulating Your Vocation and Ministry Opportunities',
    desc: "Synthesize your research, define your community's vocation, and create a plan for beginning a discernment proce.",
    steps: [
      {
        key: 'researchSummary',
        label: 'Summarizing the Research',
        icon: <FileText className="h-5 w-5" />,
        color: ['#E0E7FF', '#4338CA'],
      },
      {
        key: 'vocationalStatement',
        label: 'Proposing a Community Mission or Vocation',
        icon: <Compass className="h-5 w-5" />,
        color: ['#BFDBFE', '#2563EB'],
      },
      {
        key: 'scenarioBuilding',
        label: 'Identifying Possibilities for Ministry',
        icon: <GitBranch className="h-5 w-5" />,
        color: ['#DBEAFE', '#0EA5E9'],
      },
    ],
  },
  {
    title: 'Planning the Discernment Process',
    desc: 'Create a plan for community discernment and proactively address obstacles.',
    steps: [
      {
        key: 'discernmentPlan',
        label: 'Planning the Discernment Process',
        icon: <PenTool className="h-5 w-5" />,
        color: ['#FEF3C7', '#D97706'],
      },
      {
        key: 'implementationTesting',
        label: 'Practice Engaging the Parish',
        icon: <Briefcase className="h-5 w-5" />,
        color: ['#FDE68A', '#EA580C'],
      },
    ],
  },
  {
    title: 'Supporting Materials',
    desc: 'Access guides and resources for your journey.',
    steps: [
      {
        key: 'resourceLibrary',
        label: 'Resource Library',
        icon: <Book className="h-5 w-5" />,
        color: ['#FCE7F3', '#DB2777'],
      },
      {
        key: 'ministryInsights',
        label: 'Ministry Insights',
        icon: <LampDesk className="h-5 w-5" />,
        color: ['#FECACA', '#DC2626'],
      },
      {
        key: 'connectWithChurches',
        label: 'Connect with Churches Like Yous',
        icon: <LinkIcon className="h-5 w-5" />,
        color: ['#E0E7FF', '#4338CA'],
      },
    ],
  },
];

const CARD_META: Record<string, any> = {
  churchProfile: {
    desc: 'Document your community\'s demographics, key characteristics, and current opportunities and challenges',
    action: 'Create Profile',
    view: 'View Profile',
    link: '/community-profile',
  },
  generateSurvey: {
    desc: 'Collaborate with your Conversation Companion to develop a unique survey that will engage your community and neighborhood in your discernment process',
    action: 'Create Survey',
    view: 'Edit Survey',
    link: '/survey-build',
  },
  surveySummary: {
    desc: 'Review and understand a summary of the results of your community survey',
    action: 'Start Survey',
    view: 'View Summary',
    link: '/survey-summary',
  },
  communityResearch: {
    desc: 'Summarize the unique attributes of your neighborhood from sources on the Web.',
    action: 'Start Research',
    view: 'View Research',
    link: '/community-research',
  },
  communityAssessment: {
    desc: "Collaborate with your Conversation Companion, providing your perspective on your neighborhood.",
    action: 'Start Assessment',
    view: 'View Assessment',
    link: '/community-assessment',
  },
  churchResearch: {
    desc: "Consolidate information on your community from sources on the Web.",
    action: 'Start Research',
    view: 'View Research',
    link: '/church-research',
  },
  churchAssessment: {
    desc: "Collaborate with your Conversation Companion to provide your assessment of your community.",
    action: 'Start Assessment',
    view: 'View Assessment',
    link: '/church-assessment',
  },
  researchSummary: {
    desc: "Synthesize all of the information to provide a starting point for your discernment.",
    action: 'Create Summary',
    view: 'View Research Summary',
    link: '/research-summary',
  },
  vocationalStatement: {
    desc: "Articulate your church's calling; build a defining mission for the discernment process.",
    action: 'Create Statement',
    view: 'View Vocational Statement',
    link: '/narrative-build',
  },
  scenarioBuilding: {
    desc: "Create future ministry scenario opportunities.",
    action: 'Build Scenarios',
    view: 'View Scenarios',
    link: '/scenario-building',
  },
  discernmentPlan: {
    desc: "Create your plan for taking your community through a discernment process.",
    action: 'Create Plan',
    view: 'View Plan',
    link: '/plan-build',
  },
  implementationTesting: {
    desc: 'Plan introducing the discernment journey by virtual interaction with members of your community.',
    action: 'Start Testing',
    view: 'View Test Results',
    link: '/implementation',
  },
  resourceLibrary: {
    desc: 'Guides, templates, and articles',
    action: 'Browse Resources',
    view: 'View Resources',
    link: '/resource-library',
  },
  ministryInsights: {
    desc: 'See best practices and innovations',
    action: 'Explore Insights',
    view: 'View Insights',
    link: '/ministry-ideas',
  },
  connectWithChurches: {
    desc: 'Connect with other communities like yours and understand their discernment process',
    action: 'Connect Now',
    view: 'View Connections',
    link: '/connect',
  },
  neighborhoodSurvey: {
    desc: 'Get help in creating surveys to gather insights from your neighborhood',
    action: 'Create Survey',
    view: 'View Survey',
    link: '/survey-neighborhood-build',
  },
};

const ClergyHomePage: React.FC = () => {
  // All hooks at the top of the component
  const [showCompanionModal, setShowCompanionModal] = useState(false);
  const navigate = useNavigate();
  const { user, session, loading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useUserProfile();
  const { cardStates: hookStates } = useCardStates();
  const [userName, setUserName] = useState('there');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Extract card completion
  const cardStates: Record<string, boolean> = {};
  PHASES.flatMap(p => p.steps).forEach(s => {
    cardStates[s.key] = !!(hookStates as any)[s.key];
  });

  const total = Object.keys(cardStates).length;
  const done = Object.values(cardStates).filter(Boolean).length;
  const progress = total ? (done / total) * 100 : 0;
  
  // Card click handler
  const onCardClick = (key: string, link?: string) => {
    // If card has a direct link, navigate to it
    if (link) {
      navigate(link);
      return;
    }
    
    // Allow clicking on completed cards for specific pages
    if (cardStates[key] && ['churchProfile', 'generateSurvey', 'surveySummary'].includes(key)) {
      // For completed cards that should be directly clickable, navigate directly
      navigate(CARD_META[key]?.link || '#');
      return;
    }
    
    // For incomplete cards, check if companion has already been selected
    if (!cardStates[key]) {
      const hasSelectedCompanion = localStorage.getItem('selected_companion_id');
      
      if (hasSelectedCompanion) {
        // If companion already selected, navigate directly
        navigate(CARD_META[key]?.link || '#');
      } else {
        // Only show companion selection modal if no companion has been selected yet
        setSelectedCard(key);
        setShowModal(true);
      }
    }
  };

  // Modal completion handler
  const onModalComplete = () => {
    setShowCompanionModal(false);
    setShowModal(false);
    if (selectedCard) {
      navigate(CARD_META[selectedCard].link);
    }
  };

  // Check for companion selection when component mounts
  useEffect(() => {
    // Only check after authentication is complete
    if (!authLoading && !profileLoading && user && session) {
      const hasSelectedCompanion = localStorage.getItem('selected_companion_id');
      // Only show the modal if no companion has been selected
      setShowCompanionModal(!hasSelectedCompanion);
    }
  }, [authLoading, profileLoading, user, session]);

  // Get first name
  useEffect(() => {
    if (authLoading || profileLoading) return;
    if (!user || !session) {
      setIsLoading(false);
      return;
    }
    try {
      const first =
        profile?.name?.split(' ')[0] ||
        user.user_metadata?.full_name?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        'there';
      setUserName(first);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      setIsLoading(false);
    }
  }, [authLoading, profileLoading, user, profile, session]);

  // Use conditional rendering instead of early returns
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
        <div className="mt-4 p-4 bg-red-50 rounded text-sm text-left max-w-md">
          <p className="font-semibold">Error:</p>
          <p className="text-red-700">{error.message}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full"></div>
        <span className="ml-4">Loading your dashboard...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
        <Button asChild>
          <Link to="/signin">Sign In</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* CompanionSelectionModal - always render but only show when needed */}
      <CompanionSelectionModal
        open={showCompanionModal}
        onOpenChange={setShowCompanionModal}
        onSelectionComplete={onModalComplete}
      />
      
      {/* Main dashboard - only show when not showing companion modal */}
      {!showCompanionModal && (
        <div className="min-h-screen bg-gradient-to-br from-white via-[#D6E4F0] to-[#EAF2F8] pb-16">
          <div className="container mx-auto px-4 py-8">
            {/* Hero */}
            <div className="flex items-center justify-between mb-12">
              <div>
                <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-[#47799F] to-[#6A9BC2]">
                  Welcome, {userName}!
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Let's continue your journey of discernment and planning.
                </p>
              </div>
              <CircularProgress
                size={96}
                strokeWidth={8}
                value={progress}
                label={`${done}/${total}`}
              />
            </div>
            
            {/* Development Mode Buttons removed */}
            
            {/* Inspirational Introduction */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-10 overflow-hidden">
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-ministry mb-4">
                  Planning with Purpose: Structuring the Discernment Journey for Building New Ministries
                  </h2>
                  <p className="text-gray-700 mb-4">
                    Welcome to your Reflective Spirit journey, where vision meets action. This step-by-step guide is designed to support clergy and faith leaders in thoughtfully transforming underutilized church property into vibrant, mission-driven ministries. Through community connection, deep reflection, and structured planning, you'll uncover new possibilities rooted in your congregation's gifts and your neighborhood's needs.
                  </p>
                  <p className="text-gray-700 font-medium italic mb-8">
                    Let this journey inspire you to listen, imagine, and act—together.
                  </p>
                  
                  <h3 className="text-xl font-semibold text-ministry mb-3">
                    🚀 What You'll Accomplish:
                  </h3>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                    <li>Understand the heartbeat of your congregation and their dreams for ministry.</li>
                    <li>Explore your neighborhood to discover unmet needs and surprising opportunities.</li>
                    <li>Envision creative, sustainable uses for your church's property through inclusive planning.</li>
                    <li>Define a shared mission and vision that reflects both faith and practicality.</li>
                    <li>Design and test ideas with real-world feedback and community engagement.</li>
                    <li>Access curated resources to guide every stage of your transformation journey.</li>
                  </ul>
                  
                  <p className="text-lg font-medium text-ministry">
                    ✨ Every step brings you closer to a ministry that is faithful, sustainable, and deeply rooted in community.
                  </p>
                </div>
                <div className="lg:w-2/5 flex justify-center">
                  <img 
                    src="/ChatGPT Image Jul 4, 2025, 01_45_59 PM.png" 
                    alt="Reflective Spirit Journey" 
                    className="rounded-lg shadow-md max-w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
            
            {/* Accordion of Phases */}
            <Accordion type="single" collapsible>
              {PHASES.map((phase, i) => (
                <AccordionItem value={`phase-${i}`} key={phase.title}>
                  <AccordionTrigger>
                    <span className="text-2xl font-semibold">
                      {i + 1}. {phase.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-8">
                    <p className="mb-4 text-gray-500">{phase.desc}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {phase.steps.map(({ key, label, icon, color, link }) => {
                        const completed = cardStates[key];
                        const meta = CARD_META[key];
                        return (
                          <motion.div
                            key={key}
                            whileHover={!completed ? { scale: 1.03 } : {}}
                            className={`
                              relative overflow-hidden rounded-2xl border border-gray-200
                              transition-all duration-300
                              ${completed && !['churchProfile', 'generateSurvey', 'surveySummary'].includes(key) ? 'opacity-90' : 'hover:shadow-2xl cursor-pointer'}
                            `}
                            style={{
                              background: `linear-gradient(145deg, ${color[0]}, ${color[1]})`,
                              backgroundBlendMode: 'multiply',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            onClick={() => onCardClick(key, link)}
                            role="button"
                            aria-pressed={completed}
                            tabIndex={0}
                            onKeyDown={(e: React.KeyboardEvent) => (e.key === 'Enter' && onCardClick(key))}
                          >
                            {completed && (
                              <div className="absolute top-4 right-4 p-1 bg-white/80 rounded-full">
                                <CheckCircle className="h-6 w-6 text-emerald-600" strokeWidth={2.5} />
                              </div>
                            )}
                            <div className="flex flex-col h-full">
                              <div className="flex-1 p-6">
                                <div className="flex items-start">
                                  <div className="p-3 rounded-full bg-white/30 backdrop-blur-sm flex-shrink-0">
                                    {React.cloneElement(icon, { className: 'h-6 w-6 text-gray-800' })}
                                  </div>
                                  <div className="ml-4">
                                    <h3 className="text-lg font-bold text-gray-900">{label}</h3>
                                    <p className="mt-1 text-sm text-gray-700">{meta.desc}</p>
                                  </div>
                                </div>
                              </div>
                              <div className="px-6 pb-6 mt-auto">
                                <Button
                                  variant={completed ? 'outline' : 'default'}
                                  disabled={completed && !['churchProfile', 'generateSurvey', 'surveySummary'].includes(key)}
                                  className={`w-full font-medium ${completed ? 'bg-white/90 text-gray-800 hover:bg-white' : 'shadow-md'}`}
                                >
                                  {completed ? meta.view : meta.action}
                                  <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            {/* Companion Modal for card clicks */}
            <CompanionSelectionModal
              open={showModal}
              onOpenChange={setShowModal}
              onSelectionComplete={onModalComplete}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ClergyHomePage;
