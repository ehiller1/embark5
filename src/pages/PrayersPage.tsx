
import React from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const prayers = [
  {
    id: 1,
    title: "Prayer for Clarity in Discernment",
    category: "Clarity",
    content: "Loving God, in the midst of my questions and uncertainties, grant me clarity of mind and peace of heart. Help me to see beyond my limited perspective and to understand your greater purposes. Illuminate the path you would have me follow and give me the wisdom to recognize it. Let your Spirit guide me in all my decisions, that I may walk in the way that leads to life and wholeness. Amen."
  },
  {
    id: 2,
    title: "Prayer for Courage in Change",
    category: "Courage",
    content: "God of transformation, as I face the challenge of change, fill me with courage to move forward in faith. When fear and doubt threaten to overwhelm me, remind me of your constant presence and unfailing love. Grant me the strength to step into new possibilities and the grace to trust your guidance. Help me to remember that you have not given me a spirit of fear, but of power, love, and self-discipline. Amen."
  },
  {
    id: 3,
    title: "Prayer for Wisdom in Decision-Making",
    category: "Wisdom",
    content: "All-knowing God, I seek your wisdom as I face important decisions. You know all things, past, present, and future. Guide my thoughts and feelings, that I might discern what is right and true. Help me to balance careful consideration with trust in your providence. May I choose not merely what is expedient or comfortable, but what aligns with your will and contributes to your kingdom. Amen."
  },
  {
    id: 4,
    title: "Prayer for Patience in Waiting",
    category: "Patience",
    content: "Patient God, in times of waiting and uncertainty, help me to trust in your perfect timing. When I am eager for answers or action, grant me the grace to wait attentively. Teach me to use these moments of pause as opportunities for deeper listening and spiritual growth. Remind me that you are always at work, even when I cannot see the way forward. May I rest in your presence and find peace in your promise to lead me. Amen."
  },
  {
    id: 5,
    title: "Prayer for Community Discernment",
    category: "Community",
    content: "God of relationship, as we discern together, help us to listen to one another with open hearts and minds. Unite us in a spirit of mutual respect and common purpose. Give us the humility to set aside personal agendas and the courage to speak truth in love. May our shared discernment draw us closer to you and to each other, as we seek to follow your will for our community. Amen."
  },
  {
    id: 6,
    title: "Prayer for Openness to Unexpected Paths",
    category: "Openness",
    content: "Creative God, you often work in ways that surprise and challenge us. Open my heart to unexpected possibilities and unfamiliar paths. Give me the courage to venture beyond comfortable certainties and trusted routines. When your call leads me in new directions, help me to respond with joyful trust, knowing that you go before me and prepare the way. Amen."
  },
  {
    id: 7,
    title: "Prayer for Discerning God's Voice",
    category: "Listening",
    content: "Speaking God, in a world full of noise and competing voices, help me to recognize and respond to your voice. Quiet the clamor of my own desires and the pressures of others' expectations. Attune my heart to the gentle whisper of your Spirit. Give me patience in listening and faithfulness in following where you lead. May your word be a lamp to my feet and a light to my path. Amen."
  },
  {
    id: 8,
    title: "Prayer in Times of Confusion",
    category: "Clarity",
    content: "God of peace, when my path seems shrouded in fog and uncertainty weighs heavily upon me, be my guiding light. In my confusion, remind me of your steadfast presence and unchanging love. Clear away the distractions that cloud my vision and calm the anxieties that distort my thinking. Help me to return to the solid ground of your truth and to find my bearings in your promises. Amen."
  }
];

const categories = [...new Set(prayers.map(prayer => prayer.category))];

const PrayersPage = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Prayers for Discernment</h1>
          <p className="text-muted-foreground">
            A collection of prayers to guide your discernment journey.
          </p>
        </div>
        
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Prayers</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prayers.map(prayer => (
                <Card key={prayer.id} className="h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{prayer.title}</CardTitle>
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80">
                        {prayer.category}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{prayer.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {categories.map(category => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prayers.filter(prayer => prayer.category === category).map(prayer => (
                  <Card key={prayer.id} className="h-full">
                    <CardHeader>
                      <CardTitle>{prayer.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{prayer.content}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default PrayersPage;
