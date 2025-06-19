
import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, MapPin } from 'lucide-react';

const guides = [
  {
    id: 1,
    name: "Rev. Dr. Sarah Johnson",
    title: "Spiritual Director & Contemplative Guide",
    image: "/placeholder.svg",
    denomination: "Episcopal",
    location: "Chicago, IL",
    focus: ["Contemplative Prayer", "Discernment", "Spiritual Disciplines"],
    approach: "Drawing from Ignatian spirituality and contemplative traditions, I help clergy and congregations listen deeply to God's movement in their lives and communities. My approach emphasizes silent retreats, guided meditations, and spiritual exercises designed to deepen awareness and receptivity to the Spirit's guidance.",
    experience: "25+ years as a spiritual director, former monastery chaplain, author of 'The Contemplative Church' and 'Listening in Silence'",
    availability: ["One-on-one spiritual direction", "Congregational retreats", "Virtual discernment groups"]
  },
  {
    id: 2,
    name: "Dr. Michael Chen",
    title: "Organizational Change Consultant & Theologian",
    image: "/placeholder.svg",
    denomination: "Presbyterian",
    location: "Seattle, WA",
    focus: ["Adaptive Leadership", "Organizational Discernment", "Theological Integration"],
    approach: "I integrate organizational change theory with theological reflection to help churches navigate complex transitions. Using a systems approach, I help congregations understand their current reality, envision God's preferred future, and develop practical pathways for transformation.",
    experience: "Former seminary professor, church consultant for 15+ years, author of 'Changing Church: Theology Meets Organizational Theory'",
    availability: ["Leadership team consultations", "Congregational assessments", "Board retreats"]
  },
  {
    id: 3,
    name: "Rev. Sophia Rodriguez",
    title: "Community Engagement Specialist & Pastor",
    image: "/placeholder.svg",
    denomination: "Lutheran",
    location: "Austin, TX",
    focus: ["Contextual Ministry", "Neighborhood Engagement", "Missional Church"],
    approach: "I help congregations rediscover their neighborhoods and develop authentic community partnerships. My approach emphasizes listening campaigns, asset-based community development, and collaborative ministry design that honors both the congregation's gifts and the community's wisdom.",
    experience: "Urban pastor, community organizer, developer of the 'Church as Neighbor' training program",
    availability: ["Community listening workshops", "Neighborhood mapping exercises", "Partnership development coaching"]
  },
  {
    id: 4,
    name: "Rabbi David Goldstein",
    title: "Interfaith Dialogue Facilitator & Scholar",
    image: "/placeholder.svg",
    denomination: "Jewish (Reform)",
    location: "Boston, MA",
    focus: ["Interfaith Relations", "Sacred Text Study", "Spiritual Formation"],
    approach: "Through comparative scripture study and facilitated dialogue, I help faith communities deepen their own traditions while building meaningful connections with those of different beliefs. My work emphasizes the richness that comes from interfaith engagement and learning.",
    experience: "Rabbi for 30+ years, professor of comparative religion, co-founder of the Boston Interfaith Leadership Initiative",
    availability: ["Interfaith text study groups", "Community dialogue facilitation", "Clergy cohort leadership"]
  },
  {
    id: 5,
    name: "Rev. Dr. James Washington",
    title: "Conflict Transformation Specialist & Mediator",
    image: "/placeholder.svg",
    denomination: "Baptist",
    location: "Atlanta, GA",
    focus: ["Conflict Resolution", "Reconciliation", "Trauma-Informed Ministry"],
    approach: "I help churches transform conflict from a destructive force into an opportunity for growth and renewal. Using restorative practices and circle processes, I create safe spaces for difficult conversations and guide communities toward healing and reconciliation.",
    experience: "Trained mediator, former urban pastor, developer of the 'Healing Communities' reconciliation process",
    availability: ["Conflict assessments", "Mediation services", "Reconciliation retreats"]
  },
  {
    id: 6,
    name: "Dr. Emily Nguyen",
    title: "Missional Innovation Coach & Strategist",
    image: "/placeholder.svg",
    denomination: "Non-denominational",
    location: "Denver, CO",
    focus: ["Adaptive Ministry", "Design Thinking", "Missional Innovation"],
    approach: "Blending design thinking with theological reflection, I guide churches through processes of holy experimentation and missional innovation. My approach emphasizes rapid prototyping, community engagement, and sustainable ministry design for changing contexts.",
    experience: "Church planter, innovation consultant, developer of the 'Faithful Innovation' framework",
    availability: ["Innovation workshops", "Ministry design sprints", "Change management coaching"]
  }
];

const focusAreas = Array.from(new Set(guides.flatMap(guide => guide.focus)));

const SpiritualGuidesPage = () => {
  const [selectedFocus, setSelectedFocus] = React.useState("All");
  
  const filteredGuides = selectedFocus === "All" 
    ? guides
    : guides.filter(guide => guide.focus.includes(selectedFocus));
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Spiritual Guides</h1>
          <p className="text-muted-foreground">
            Connect with experienced spiritual directors and consultants to guide your discernment journey.
          </p>
        </div>
        
        <div className="mb-6">
          <Tabs defaultValue="All" onValueChange={setSelectedFocus}>
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="All">All Focus Areas</TabsTrigger>
              {focusAreas.map(area => (
                <TabsTrigger key={area} value={area}>{area}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGuides.map((guide) => (
            <Card key={guide.id} className="h-full">
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={guide.image} alt={guide.name} />
                    <AvatarFallback>{guide.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{guide.name}</CardTitle>
                    <CardDescription>{guide.title}</CardDescription>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {guide.location} • {guide.denomination}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {guide.focus.map(area => (
                    <Badge key={area} variant="outline">{area}</Badge>
                  ))}
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm">Approach</h4>
                    <p className="text-muted-foreground text-sm mt-1">{guide.approach}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Experience</h4>
                    <p className="text-muted-foreground text-sm mt-1">{guide.experience}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Available For</h4>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground mt-1">
                      {guide.availability.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex justify-between w-full">
                  <Button variant="outline" className="w-1/2 mr-2" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule
                  </Button>
                  <Button className="w-1/2" size="sm">
                    Contact
                    <ChevronRight className="h-4 w-4 ml-1" />
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

export default SpiritualGuidesPage;
