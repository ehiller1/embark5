
import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

const caseStudies = [
  {
    id: 1,
    title: "Rural Church Revitalization",
    location: "Heartland Community Church, Midwest USA",
    categories: ["Rural", "Revitalization", "Aging Congregation"],
    summary: "Facing declining attendance and an aging congregation, this rural church transformed by reconnecting with its agricultural community roots, developing intergenerational ministries, and embracing technology for outreach.",
    keyInsights: [
      "Developed community garden ministry connecting with local food banks",
      "Created mentoring program pairing seniors with youth for skill-sharing",
      "Implemented hybrid worship model to reach homebound members and distant community",
      "Emphasized local history and agricultural heritage in worship and community events"
    ],
    outcomes: "Over three years, the church saw a 30% increase in attendance, particularly among young families, and developed five new community-focused ministries."
  },
  {
    id: 2,
    title: "Urban Church Community Engagement",
    location: "Grace Fellowship, Major Metropolitan Area",
    categories: ["Urban", "Community Engagement", "Diversity"],
    summary: "This urban congregation transformed from a commuter church to a neighborhood anchor by developing deep relationships with local schools, businesses, and community organizations.",
    keyInsights: [
      "Conducted community listening sessions to identify neighborhood needs",
      "Repurposed underused church facilities for community services",
      "Developed partnerships with local schools for after-school programming",
      "Created multilingual worship opportunities reflecting neighborhood demographics"
    ],
    outcomes: "The church became a trusted community hub, tripled its local membership, and helped establish a neighborhood association that secured funding for local improvements."
  },
  {
    id: 3,
    title: "Suburban Church Addressing Changing Demographics",
    location: "New Hope Community, Suburban Area",
    categories: ["Suburban", "Demographics", "Cultural Change"],
    summary: "This suburban congregation successfully navigated changing neighborhood demographics by embracing cultural diversity, addressing language barriers, and creating inclusive worship and ministry models.",
    keyInsights: [
      "Created leadership development pathways for new community members",
      "Implemented translation services and multilingual resources",
      "Revised liturgical practices to incorporate diverse cultural expressions",
      "Developed cultural competency training for established congregation members"
    ],
    outcomes: "The church's membership now reflects the diversity of its changing neighborhood, with leadership equally distributed among different cultural groups and five new culturally-responsive ministries established."
  },
  {
    id: 4,
    title: "Financial Sustainability in a Historic Downtown Church",
    location: "First Church Downtown, Historic District",
    categories: ["Urban", "Financial Sustainability", "Historic Preservation"],
    summary: "This historic downtown congregation faced crushing maintenance costs and a dwindling endowment, but found new sustainability through creative space sharing, adaptive reuse, and mission-aligned revenue streams.",
    keyInsights: [
      "Developed arts cooperative using sanctuary space on weekdays",
      "Created affordable housing units in underused education building",
      "Established community event venue with mission-aligned pricing structure",
      "Formed preservation partnership with local historical society"
    ],
    outcomes: "The church eliminated its operating deficit, created a sustainable maintenance fund, and increased its community impact through mission-aligned space use."
  },
  {
    id: 5,
    title: "Digital Ministry Development During Pandemic",
    location: "Community of Faith, Nationwide",
    categories: ["Digital Ministry", "Pandemic Response", "Innovation"],
    summary: "When the pandemic forced closure of in-person gatherings, this congregation quickly pivoted to develop a robust digital ministry ecosystem that has continued to thrive alongside renewed in-person gatherings.",
    keyInsights: [
      "Created digital ministry team with diverse technical and pastoral skills",
      "Developed multiplatform approach beyond streaming services",
      "Established digital small groups for specific demographic needs",
      "Implemented digital giving and volunteer management systems"
    ],
    outcomes: "The church retained 95% of its congregation through the pandemic, added 200 new participants from across the country, and developed a sustainable hybrid ministry model."
  },
  {
    id: 6,
    title: "Multisite Church to Independent Congregations",
    location: "Cornerstone Network, Regional",
    categories: ["Multisite", "Church Planting", "Organizational Change"],
    summary: "This multisite church network successfully transitioned from centralized leadership to a network of independent but affiliated congregations, creating greater contextual ministry opportunities.",
    keyInsights: [
      "Developed graduated autonomy plan for campus pastors",
      "Created shared resource model for transitional period",
      "Established network covenant defining ongoing relationships",
      "Implemented contextual ministry training for local leadership"
    ],
    outcomes: "All five former campuses successfully transitioned to independent congregations within the network, with three additional church plants joining the association within two years."
  }
];

const allCategories = Array.from(new Set(caseStudies.flatMap(study => study.categories)));

const CaseStudiesPage = () => {
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  
  const filteredStudies = selectedCategory === "All" 
    ? caseStudies 
    : caseStudies.filter(study => study.categories.includes(selectedCategory));
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Case Studies</h1>
          <p className="text-muted-foreground">
            Learn from the experiences of other churches that have successfully navigated change.
          </p>
        </div>
        
        <div className="mb-6">
          <Tabs defaultValue="All" onValueChange={setSelectedCategory}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="All">All Categories</TabsTrigger>
              {allCategories.map(category => (
                <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredStudies.map((study) => (
            <Card key={study.id} className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl">{study.title}</CardTitle>
                <CardDescription>{study.location}</CardDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {study.categories.map(category => (
                    <Badge key={`${study.id}-${category}`} variant="outline">{category}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="mb-4">{study.summary}</p>
                <div>
                  <h4 className="font-medium mb-2">Key Insights:</h4>
                  <ul className="list-disc pl-5 space-y-1">
                    {study.keyInsights.map((insight, index) => (
                      <li key={index} className="text-sm text-muted-foreground">{insight}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="w-full">
                  <h4 className="font-medium mb-2">Outcomes:</h4>
                  <p className="text-sm text-muted-foreground">{study.outcomes}</p>
                  <Button variant="outline" className="w-full mt-4" size="sm">
                    View Full Case Study
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default CaseStudiesPage;
