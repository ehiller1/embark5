import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Types
interface ParishCompanion {
  id: string;
  name: string;
  description?: string;
  avatar_url?: string;
  speech_pattern?: string;
  knowledge_domains?: string;
  companion_type?: string;
}

export default function ParishCompanionSelection() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [companions, setCompanions] = useState<ParishCompanion[]>([]);
  const [loadingCompanions, setLoadingCompanions] = useState(true);
  const [selectedCompanion, setSelectedCompanion] = useState<ParishCompanion | null>(null);
  const [selectedCompanionId, setSelectedCompanionId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [detailCompanion, setDetailCompanion] = useState<ParishCompanion | null>(null);
  
  // Load companions
  useEffect(() => {
    const fetchCompanions = async () => {
      try {
        setLoadingCompanions(true);
        
        const { data, error } = await supabase
          .from('Companion_parish')
          .select('companion, companion_type, traits, speech_pattern, memory_threshold, knowledge_domains, avatar_url, "UUID"');
          
        if (error) throw error;
        
        if (data) {
          // Map the companions to match the expected structure
          const mappedCompanions = (data || []).map(companion => ({
            id: companion.UUID,
            name: companion.companion || 'Parish Companion',
            description: companion.traits || '',
            speech_pattern: companion.speech_pattern || '',
            knowledge_domains: companion.knowledge_domains || '',
            avatar_url: companion.avatar_url || ''
          }));
          
          setCompanions(mappedCompanions);
          console.log('Loaded companions:', mappedCompanions);
        }
      } catch (error) {
        console.error('Error loading companions:', error);
        toast({
          title: "Error",
          description: "Failed to load companions. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingCompanions(false);
      }
    };
    
    fetchCompanions();
  }, [toast]);
  
  // Handle companion selection
  const handleSelectCompanion = (companionId: string) => {
    // Handle opt-out option
    if (companionId === 'opt-out') {
      setSelectedCompanionId('opt-out');
      setSelectedCompanion(null);
      localStorage.setItem('parish_companion', JSON.stringify({id: 'no-companion', name: 'No Companion'}));
      return;
    }
    
    // Find the selected companion
    const companion = companions.find(c => c.id === companionId);
    if (companion) {
      setSelectedCompanionId(companionId);
      setSelectedCompanion(companion);
      localStorage.setItem('parish_companion', JSON.stringify(companion));
    }
  };
  
  // Handle card click to view details
  const handleCardClick = (companion: ParishCompanion) => {
    setDetailCompanion(companion);
  };
  
  // Handle image load error
  const handleImageError = (companionId: string) => {
    setImageErrors(prev => ({ ...prev, [companionId]: true }));
  };
  
  // Handle next step button click
  const handleNextStep = () => {
    if (selectedCompanionId) {
      // Log for debugging
      console.log('Navigating to survey with companion ID:', selectedCompanionId);
      
      // Force navigation to the survey page
      window.location.href = '/conversation-parish-survey';
    } else {
      toast({
        title: "Selection Required",
        description: "Please select a companion or proceed without one to continue.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      <Dialog open={true} onOpenChange={() => false}>
        <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl text-left">Select a Companion</DialogTitle>
            <DialogDescription className="text-left">
              Select a companion to assist you that reflects your point of view.  The companion will help you articulate your thinking and clearly communicate your point of view.
            </DialogDescription>
          </DialogHeader>
          
          {loadingCompanions ? (
            <div className="flex justify-center p-8">
              <p>Loading companions...</p>
            </div>
          ) : (
            <>
              <RadioGroup 
                value={selectedCompanionId || ''} 
                onValueChange={handleSelectCompanion}
                className="space-y-4"
              >
                {/* Opt-out option */}
                <div className="flex items-start space-x-3 p-2 rounded-md hover:bg-gray-50">
                  <RadioGroupItem value="opt-out" id="opt-out" className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor="opt-out" className="font-medium cursor-pointer">
                      Proceed without a companion
                    </Label>
                  </div>
                </div>
                
                {/* Companion cards with radio buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
                  {companions.map((companion) => (
                    <Card 
                      key={companion.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedCompanionId === companion.id ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <CardContent className="flex flex-col items-center p-4 text-center">
                        <div className="flex items-center justify-center w-full mb-2">
                          <RadioGroupItem 
                            value={companion.id} 
                            id={companion.id} 
                            className="mr-2" 
                          />
                          <Label htmlFor={companion.id} className="cursor-pointer">
                            <Avatar 
                              className="h-16 w-16 cursor-pointer" 
                              onClick={() => handleCardClick(companion)}
                            >
                              <AvatarFallback>{companion.name.charAt(0)}</AvatarFallback>
                              {companion.avatar_url && !imageErrors[companion.id] && (
                                <AvatarImage 
                                  src={companion.avatar_url} 
                                  onError={() => handleImageError(companion.id)}
                                />
                              )}
                            </Avatar>
                          </Label>
                        </div>
                        <h3 className="font-medium text-sm mt-2">{companion.name}</h3>
                        {companion.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{companion.description}</p>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-xs" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(companion);
                          }}
                        >
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
              
              <DialogFooter className="flex justify-center mt-6">
                <Button 
                  onClick={handleNextStep}
                  disabled={!selectedCompanionId}
                  className="px-8"
                >
                  Next Step
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Companion detail dialog */}
      {detailCompanion && (
        <Dialog open={true} onOpenChange={(open) => !open && setDetailCompanion(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{detailCompanion?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 py-4">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={detailCompanion?.avatar_url || ''} 
                  onError={() => {
                    if (detailCompanion) {
                      setImageErrors(prev => ({ ...prev, [detailCompanion.id]: true }));
                    }
                  }} 
                  className={detailCompanion && imageErrors[detailCompanion.id] ? 'hidden' : ''}
                />
                <AvatarFallback className="text-2xl">{detailCompanion?.name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              
              <div className="space-y-2 text-center">
                <h3 className="font-medium">{detailCompanion?.name}</h3>
                {detailCompanion?.description && (
                  <p className="text-sm text-gray-500">{detailCompanion.description}</p>
                )}
                {detailCompanion?.knowledge_domains && (
                  <div>
                    <h4 className="text-sm font-medium">Knowledge Areas:</h4>
                    <p className="text-sm text-gray-500">{detailCompanion.knowledge_domains}</p>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDetailCompanion(null)}>Close</Button>
              <Button 
                onClick={() => {
                  if (detailCompanion) {
                    handleSelectCompanion(detailCompanion.id);
                    setDetailCompanion(null);
                  }
                }}
                disabled={detailCompanion ? selectedCompanionId === detailCompanion.id : false}
              >
                {detailCompanion && selectedCompanionId === detailCompanion.id ? 'Currently Selected' : 'Select'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
