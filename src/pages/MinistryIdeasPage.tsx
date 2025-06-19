
import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'; // TabsContent is unused
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HeartIcon, BookmarkIcon, Search } from 'lucide-react';

const ministryIdeas = [
  {
    id: 1,
    title: "Community Garden Ministry",
    category: "Community Outreach",
    difficulty: "Medium",
    resourceNeeds: "Low-Medium",
    description: "Create a church community garden that provides fresh produce for local food banks while offering opportunities for intergenerational connection, outdoor activity, and creation care education.",
    keyComponents: [
      "Garden plots for church and community members",
      "Educational workshops on gardening and sustainability",
      "Regular harvest donations to local food banks",
      "Seasonal celebrations tied to planting and harvest"
    ],
    implementationSteps: [
      "Form garden planning committee",
      "Assess available land and resources",
      "Develop partnerships with local gardening experts",
      "Create garden plot allocation system",
      "Schedule regular workdays and educational events"
    ]
  },
  {
    id: 2,
    title: "Digital Devotional Series",
    category: "Spiritual Formation",
    difficulty: "Low",
    resourceNeeds: "Low",
    description: "Develop a series of digital devotionals delivered via email, social media, or dedicated app to help congregation members engage in spiritual practices throughout their week.",
    keyComponents: [
      "Brief Scripture readings with reflection questions",
      "Recorded prayers or guided meditation",
      "Weekly or daily distribution schedule",
      "Opportunities for community response and sharing"
    ],
    implementationSteps: [
      "Assemble content creation team",
      "Develop content calendar aligned with church seasons",
      "Create template for consistent delivery",
      "Set up digital distribution platform",
      "Develop feedback mechanism for improvement"
    ]
  },
  {
    id: 3,
    title: "Intergenerational Mentoring Program",
    category: "Discipleship",
    difficulty: "Medium",
    resourceNeeds: "Low",
    description: "Create a structured mentoring program pairing older and younger generations for mutual learning, relationship building, and faith formation.",
    keyComponents: [
      "Mentoring pairs or small groups meeting regularly",
      "Curriculum resources for guided conversations",
      "Periodic community gatherings for all participants",
      "Service projects for pairs to work on together"
    ],
    implementationSteps: [
      "Recruit coordinator team representing multiple generations",
      "Develop application and matching process",
      "Create orientation program for participants",
      "Compile or develop conversation guide resources",
      "Schedule regular check-ins with participants"
    ]
  },
  {
    id: 4,
    title: "Community Arts Initiative",
    category: "Community Outreach",
    difficulty: "Medium-High",
    resourceNeeds: "Medium",
    description: "Transform underutilized church spaces into art studios, galleries, or performance venues, inviting local artists to share their work while connecting with the congregation.",
    keyComponents: [
      "Studio or gallery space in church facility",
      "Regular exhibitions or performances",
      "Art classes or workshops for various ages",
      "Theological reflection on art and creativity"
    ],
    implementationSteps: [
      "Assess available spaces and needed modifications",
      "Form partnerships with local arts organizations",
      "Develop submission or application process for artists",
      "Create schedule for exhibitions or performances",
      "Plan for integration with worship or formation opportunities"
    ]
  },
  {
    id: 5,
    title: "Neighboring Initiative",
    category: "Community Outreach",
    difficulty: "Low",
    resourceNeeds: "Low",
    description: "Encourage church members to build relationships with their literal neighbors through intentional practices of hospitality, service, and community-building.",
    keyComponents: [
      "Neighborhood mapping exercise for members",
      "Tools and resources for neighborhood connection",
      "Regular sharing of stories and experiences",
      "Neighborhood service projects"
    ],
    implementationSteps: [
      "Create simple neighborhood connection resources",
      "Host workshop on neighboring practices",
      "Establish regular sharing opportunities in worship or small groups",
      "Provide small grants for neighborhood gatherings",
      "Celebrate stories of transformation through neighboring"
    ]
  },
  {
    id: 6,
    title: "Creation Care Team",
    category: "Environmental Stewardship",
    difficulty: "Medium",
    resourceNeeds: "Varies",
    description: "Establish a team focused on helping the congregation practice environmental stewardship through education, facility improvements, and community initiatives.",
    keyComponents: [
      "Environmental audit of church facilities",
      "Educational programs on creation care theology",
      "Implementation of sustainability practices",
      "Community partnerships for environmental action"
    ],
    implementationSteps: [
      "Recruit team with environmental expertise",
      "Conduct baseline assessment of church practices",
      "Develop prioritized action plan",
      "Create educational materials for congregation",
      "Implement changes in phases with clear communication"
    ]
  },
  {
    id: 7,
    title: "Microchurch Network",
    category: "Church Structure",
    difficulty: "High",
    resourceNeeds: "Low-Medium",
    description: "Develop a network of small, home-based faith communities that meet regularly for worship, study, and service while maintaining connection to the larger congregation.",
    keyComponents: [
      "Multiple microchurches meeting in homes or public spaces",
      "Leadership development pathway",
      "Regular gatherings of entire network",
      "Shared resources and support systems"
    ],
    implementationSteps: [
      "Identify and train initial microchurch leaders",
      "Develop core practices for all microchurches",
      "Create resource library for gatherings",
      "Establish communication system between groups",
      "Schedule regular leader cohort meetings and network gatherings"
    ]
  },
  {
    id: 8,
    title: "Mental Health Ministry",
    category: "Pastoral Care",
    difficulty: "Medium-High",
    resourceNeeds: "Medium",
    description: "Create a comprehensive ministry addressing mental health through education, support groups, resource navigation, and stigma reduction.",
    keyComponents: [
      "Educational workshops on mental health topics",
      "Support groups for various needs",
      "Resource referral system for professional help",
      "Mental health first aid training for leaders"
    ],
    implementationSteps: [
      "Form planning team including mental health professionals",
      "Assess congregation's mental health literacy and needs",
      "Compile local mental health resources",
      "Develop educational workshop series",
      "Train group facilitators for support groups"
    ]
  }
];

const categories = [...new Set(ministryIdeas.map(idea => idea.category))];

const MinistryIdeasPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const filteredIdeas = ministryIdeas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || idea.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Ministry Ideas</h1>
          <p className="text-muted-foreground">
            Explore innovative ministry ideas to inspire your church's next steps.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search ministry ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Tabs defaultValue="All" onValueChange={setSelectedCategory} className="w-full sm:w-auto">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="All">All</TabsTrigger>
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIdeas.map((idea) => (
            <Card key={idea.id} className="h-full flex flex-col">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{idea.title}</CardTitle>
                    <CardDescription className="mt-1">{idea.category}</CardDescription>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon">
                      <BookmarkIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <HeartIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="mb-4">{idea.description}</p>
                <div className="flex space-x-4 mb-4">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Difficulty</span>
                    <Badge variant="outline">{idea.difficulty}</Badge>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">Resources</span>
                    <Badge variant="outline">{idea.resourceNeeds}</Badge>
                  </div>
                </div>
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Key Components:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {idea.keyComponents.map((component, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{component}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="w-full">
                  <h4 className="font-medium mb-2">Implementation Steps:</h4>
                  <ol className="list-decimal pl-5 space-y-1">
                    {idea.implementationSteps.map((step, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{step}</li>
                    ))}
                  </ol>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default MinistryIdeasPage;
