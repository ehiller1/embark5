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
    title: 'Understanding Your Church',
    desc: 'Gather and analyze information about your congregation.',
    steps: [
      {
        key: 'churchProfile',
        label: 'Congregational Profile',
        icon: <Building className="h-5 w-5" />,
        color: ['#E0F2FF', '#3B82F6'],
      },
      {
        key: 'surveySummary',
        label: 'Survey Summary',
        icon: <BarChart3 className="h-5 w-5" />,
        color: ['#DBEAFE', '#6366F1'],
      },
    ],
  },
  {
    title: 'Knowing Your Community',
    desc: 'Research and assess your surrounding community context.',
    steps: [
      {
        key: 'communityResearch',
        label: 'Community Research',
        icon: <FileSearch className="h-5 w-5" />,
        color: ['#D1FAE5', '#059669'],
      },
      {
        key: 'communityAssessment',
        label: 'Community Assessment',
        icon: <ChartPie className="h-5 w-5" />,
        color: ['#6EE7B7', '#047857'],
      },
    ],
  },
  {
    title: 'Church Research and Assessment',
    desc: "Analyze your church's context and capacity.",
    steps: [
      {
        key: 'churchResearch',
        label: 'Church Research',
        icon: <BookOpen className="h-5 w-5" />,
        color: ['#FCE7F3', '#DB2777'],
      },
      {
        key: 'churchAssessment',
        label: 'Church Assessment',
        icon: <Users className="h-5 w-5" />,
        color: ['#FECACA', '#DC2626'],
      },
    ],
  },
  {
    title: 'Discernment and Planning',
    desc: "Synthesize research, define your church's vocation, and create a discernment plan.",
    steps: [
      {
        key: 'researchSummary',
        label: 'Research Summary',
        icon: <FileText className="h-5 w-5" />,
        color: ['#E0E7FF', '#4338CA'],
      },
      {
        key: 'vocationalStatement',
        label: 'Your Mission or Vocation',
        icon: <Compass className="h-5 w-5" />,
        color: ['#BFDBFE', '#2563EB'],
      },
      {
        key: 'scenarioBuilding',
        label: 'Scenario Building',
        icon: <GitBranch className="h-5 w-5" />,
        color: ['#DBEAFE', '#0EA5E9'],
      },
    ],
  },
  {
    title: 'Implementation and Testing',
    desc: 'Create a discernment plan and test its implementation.',
    steps: [
      {
        key: 'discernmentPlan',
        label: 'Planning the Discernment Process',
        icon: <PenTool className="h-5 w-5" />,
        color: ['#FEF3C7', '#D97706'],
      },
      {
        key: 'implementationTesting',
        label: 'Engaging the Parish',
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
        label: 'Connect with Churches',
        icon: <LinkIcon className="h-5 w-5" />,
        color: ['#E0E7FF', '#4338CA'],
      },
    ],
  },
];

const CARD_META: Record<string, any> = {
  churchProfile: {
    desc: 'Profile your church community',
    action: 'Create Profile',
    view: 'View Profile',
    link: '/community-profile',
  },
  surveySummary: {
    desc: 'Summarize congregation input',
    action: 'Start Survey',
    view: 'View Summary',
    link: '/survey-summary',
  },
  communityResearch: {
    desc: 'Research your neighborhood context',
    action: 'Start Research',
    view: 'View Research',
    link: '/community-research',
  },
  communityAssessment: {
    desc: "Assess your community's needs",
    action: 'Start Assessment',
    view: 'View Assessment',
    link: '/community-assessment',
  },
  churchResearch: {
    desc: "Research your church context",
    action: 'Start Research',
    view: 'View Research',
    link: '/church-research',
  },
  churchAssessment: {
    desc: "Assess your church's capacity",
    action: 'Start Assessment',
    view: 'View Assessment',
    link: '/church-assessment',
  },
  researchSummary: {
    desc: 'Synthesize research findings',
    action: 'Create Summary',
    view: 'View Research Summary',
    link: '/research-summary',
  },
  vocationalStatement: {
    desc: "Define your church's calling",
    action: 'Create Statement',
    view: 'View Vocational Statement',
    link: '/narrative-build',
  },
  scenarioBuilding: {
    desc: 'Create future ministry scenarios',
    action: 'Build Scenarios',
    view: 'View Scenarios',
    link: '/scenario-building',
  },
  discernmentPlan: {
    desc: 'Create your strategic plan',
    action: 'Create Plan',
    view: 'View Plan',
    link: '/plan-build',
  },
  implementationTesting: {
    desc: 'Test your ministry plan',
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
    desc: 'Best practices and innovations',
    action: 'Explore Insights',
    view: 'View Insights',
    link: '/ministry-ideas',
  },
  connectWithChurches: {
    desc: 'Network and collaborate',
    action: 'Connect Now',
    view: 'View Connections',
    link: '/connect',
  },
};

const ClergyHomePage: React.FC = () => {
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

  if (error) return (
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

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-primary rounded-full"></div>
      <span className="ml-4">Loading your dashboard...</span>
    </div>
  );

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Please sign in to continue</h1>
      <Button asChild>
        <Link to="/signin">Sign In</Link>
      </Button>
    </div>
  );

  const onCardClick = (key: string) => {
    if (cardStates[key]) return;
    setSelectedCard(key);
    setShowModal(true);
  };

  const onModalComplete = () => {
    setShowModal(false);
    if (selectedCard) navigate(CARD_META[selectedCard].link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 pb-16">
      <div className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-400">
              Welcome back, {userName}!
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Your discernment journey in progress.
            </p>
          </div>
          <CircularProgress
            size={96}
            strokeWidth={8}
            value={progress}
            label={`${done}/${total}`}
          />
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
                  {phase.steps.map(({ key, label, icon, color }) => {
                    const completed = cardStates[key];
                    const meta = CARD_META[key];
                    return (
                      <motion.div
                        key={key}
                        whileHover={!completed ? { scale: 1.03 } : {}}
                        className={`
                          relative overflow-hidden rounded-2xl border border-gray-200
                          bg-white/80 transition-shadow
                          ${completed ? 'opacity-60' : 'hover:shadow-2xl cursor-pointer'}
                        `}
                        style={{
                          background: `linear-gradient(135deg, ${color[0]}, ${color[1]})`,
                          backgroundBlendMode: 'multiply',
                        }}
                        onClick={() => onCardClick(key)}
                        role="button"
                        aria-pressed={completed}
                        tabIndex={0}
                        onKeyDown={(e: React.KeyboardEvent) => (e.key === 'Enter' && onCardClick(key))}
                      >
                        {completed && (
                          <CheckCircle className="absolute top-4 right-4 text-green-500 h-6 w-6" />
                        )}
                        <div className="flex items-center px-6 py-5">
                          <div className="p-3 bg-indigo-100 rounded-full">
                            {icon}
                          </div>
                          <div className="ml-4">
                            <h3 className="text-lg font-semibold">{label}</h3>
                            <p className="text-sm text-gray-500">{meta.desc}</p>
                          </div>
                        </div>
                        <div className="px-6 pb-6">
                          <Button
                            variant={completed ? 'outline' : 'default'}
                            disabled={completed}
                            className="w-full"
                          >
                            {completed ? meta.view : meta.action}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Companion Modal */}
        <CompanionSelectionModal
          open={showModal}
          onOpenChange={setShowModal}
          onSelectionComplete={onModalComplete}
        />
      </div>
    </div>
  );
};

export default ClergyHomePage;
