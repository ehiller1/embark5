import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Users, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ArchetypesPanel } from './ArchetypesPanel';
import { ImplementationCard } from '@/types/ImplementationTypes';

interface StakeholdersSectionProps {
  onCardSelect: (cards: ImplementationCard[]) => void;
  openChatModal: (nodeIds: string[]) => void;
}

export function StakeholdersSection({
  onCardSelect,
  openChatModal,
}: StakeholdersSectionProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('archetypes');

  const handleArchetypeSelect = (cards: ImplementationCard[]) => {
    onCardSelect(cards);
    // Auto-open chat for the first selected card
    if (cards.length > 0) {
      openChatModal(cards.map(card => card.id));
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Typical Stakeholders</CardTitle>
          <CardDescription>Below are common stakeholders that exist in a faith community.  Chose stakeholders that might fit your community and start a dialogue.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="w-full rounded-none border-b px-4">
            <TabsTrigger value="archetypes" className="flex items-center">
              <Users className="h-4 w-4 mr-2" /> Archetypes
            </TabsTrigger>
            <TabsTrigger value="myNetwork" className="flex items-center">
              <Users className="h-4 w-4 mr-2" /> My Network
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-hidden">
            <TabsContent value="archetypes" className="h-full m-0">
              <div className="h-full">
                <ArchetypesPanel 
                  onCardSelect={handleArchetypeSelect}
                  openChatModal={openChatModal}
                />
              </div>
            </TabsContent>
            <TabsContent value="myNetwork" className="h-full m-0">
              <div className="p-4 text-center text-muted-foreground">
                <p>Your network of connections will appear here.</p>
                <p className="text-sm mt-2">Start by adding stakeholders or creating connections.</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
