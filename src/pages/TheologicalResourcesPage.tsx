
import { useState } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Search, BookOpen } from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  category: string;
  author: string;
  description: string;
  content: string;
  link: string;
}

interface CategoryPreviewProps {
  category: string;
  onResourceClick: (resource: Resource) => void;
}

const resources: Resource[] = [
  {
    id: 1,
    title: "Embracing Change: A Theological Framework",
    category: "Change Management",
    author: "Dr. Sarah Johnson",
    description: "This resource explores how theological principles can inform and guide processes of change within faith communities. Drawing on biblical narratives of transformation and theological understandings of renewal, it offers a framework for approaching change as a spiritual practice.",
    content: "Change is an inevitable part of the life of faith communities. From the exodus journey of the Israelites to the radical transformation of the early church at Pentecost, Scripture is filled with stories of God's people navigating significant transitions. These biblical narratives offer us theological resources for understanding change not merely as a pragmatic necessity but as a spiritual opportunity...",
    link: "#"
  },
  {
    id: 2,
    title: "Discernment in Community: Theological Perspectives",
    category: "Discernment",
    author: "Rev. Dr. Michael Chen",
    description: "This resource examines various theological traditions' approaches to communal discernment, offering practical insights for congregations engaging in collective decision-making processes.",
    content: "Christian discernment has always been understood as both an individual and communal practice. From the Jerusalem Council described in Acts 15 to the monastic traditions of shared deliberation, Christians have sought to discern God's will together. This resource explores how different theological traditions have approached the practice of communal discernment...",
    link: "#"
  },
  {
    id: 3,
    title: "The Theology of Mission in Changing Contexts",
    category: "Mission",
    author: "Dr. Elizabeth Mbatha",
    description: "This work explores how theological understandings of mission can adapt to changing cultural and social contexts without compromising core values and beliefs.",
    content: "The church's understanding of its mission has evolved throughout history in response to changing contexts and challenges. This resource examines how theological reflection on mission can help congregations navigate the tension between faithfulness to tradition and responsiveness to new realities...",
    link: "#"
  },
  {
    id: 4,
    title: "Ecclesiology for a Digital Age",
    category: "Ecclesiology",
    author: "Rev. Dr. Thomas Rivera",
    description: "An exploration of how theological understandings of church (ecclesiology) can inform and be shaped by the digital contexts in which many congregations now partially operate.",
    content: "The rapid digitalization of society presents both challenges and opportunities for theological understandings of church. This resource explores how traditional ecclesiological concepts such as communion, presence, and gathering can be reimagined for contexts where digital communication supplements or even temporarily replaces physical gathering...",
    link: "#"
  },
  {
    id: 5,
    title: "Theology of Leadership in Times of Transition",
    category: "Leadership",
    author: "Dr. Rachel Kim",
    description: "This resource examines biblical models of leadership during times of significant change and offers theological reflections on leading communities through transitions.",
    content: "Leadership during times of transition requires particular theological grounding and practical wisdom. This resource explores biblical models of transitional leadership, from Moses preparing for succession to Jesus preparing his disciples for his absence. It offers theological reflections on how leaders can navigate the challenges and opportunities that come with periods of significant change...",
    link: "#"
  },
  {
    id: 6,
    title: "The Holy Spirit and Organizational Change",
    category: "Change Management",
    author: "Dr. James Washington",
    description: "An exploration of pneumatology (theology of the Holy Spirit) as it relates to processes of organizational change in congregations.",
    content: "The Holy Spirit has often been described as the 'forgotten person' of the Trinity in theological reflection. Yet pneumatology (the theology of the Holy Spirit) offers rich resources for thinking about organizational change. This resource explores how understanding the Spirit as the agent of renewal and transformation can inform congregational change processes...",
    link: "#"
  }
];

const categories = [...new Set(resources.map(resource => resource.category))];

const CategoryPreview = ({ category, onResourceClick }: CategoryPreviewProps) => {
  // Get resources for this category
  const categoryResources = resources.filter(r => r.category === category);
  // Display at most 2 items per category
  const displayResources = categoryResources.slice(0, 2);
  
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">{category}</h3>
        {categoryResources.length > 2 && (
          <Button variant="link" size="sm">
            View all {categoryResources.length}
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayResources.map(resource => (
          <Card 
            key={resource.id}
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onResourceClick(resource)}
          >
            <div className="bg-muted h-32 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-br from-primary/10 to-purple-500/5 flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                </div>
              </div>
              <Badge className="absolute top-2 right-2">{resource.category}</Badge>
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg line-clamp-1">{resource.title}</CardTitle>
              <CardDescription>By {resource.author}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {resource.description}
              </p>
            </CardContent>
            <CardFooter className="pt-0 pb-4">
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                Read Resource
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

const TheologicalResourcesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [currentTab, setCurrentTab] = useState("all");
  
  const filteredResources = resources.filter(resource => 
    searchQuery === "" ||
    resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Theological Resources for Change</h1>
          <p className="text-muted-foreground">
            Explore theological perspectives on change, transition, and renewal in faith communities.
          </p>
        </div>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search resources..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Resources</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            {categories.map(category => (
              <CategoryPreview 
                key={category} 
                category={category}
                onResourceClick={setSelectedResource}
              />
            ))}
          </TabsContent>
          
          {categories.map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources
                  .filter(resource => resource.category === category)
                  .map(resource => (
                    <Card 
                      key={resource.id} 
                      className="h-full flex flex-col hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedResource(resource)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle>{resource.title}</CardTitle>
                        </div>
                        <CardDescription>By {resource.author}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-muted-foreground mb-4">{resource.description}</p>
                      </CardContent>
                      <CardFooter className="pt-0">
                        <Button variant="outline" className="w-full" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Read Full Resource
                        </Button>
                      </CardFooter>
                    </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      
      <Dialog open={!!selectedResource} onOpenChange={(open) => !open && setSelectedResource(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedResource?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center mb-4">
              <Badge className="mr-2">{selectedResource?.category}</Badge>
              <span className="text-sm text-muted-foreground">By {selectedResource?.author}</span>
            </div>
            
            <ScrollArea className="h-[60vh] pr-4">
              <div className="prose max-w-none">
                {selectedResource?.content}
              </div>
            </ScrollArea>
            
            <div className="mt-6 pt-4 flex justify-end">
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Read Full Resource
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TheologicalResourcesPage;
