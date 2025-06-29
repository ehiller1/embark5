import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScenarioItem } from '@/types/NarrativeTypes';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

// Extended scenario item with optional additional fields that might come from the AI response
type ExtendedScenarioItem = Omit<ScenarioItem, 'targetAudience'> & {
  targetAudience?: string[]; // Ensure targetAudience is always string[]
  strategicRationale?: string;
  theologicalJustification?: string;
  potentialChallengesBenefits?: string;
  successIndicators?: string;
  impactOnCommunity?: string;
  [key: string]: any; // Allow any additional fields
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface RefinedScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  refinedScenarios: ScenarioItem[];
  onSave: (scenarios: ScenarioItem[]) => Promise<void>;
  isSaving: boolean;
}

export const RefinedScenarioModal: React.FC<RefinedScenarioModalProps> = ({
  isOpen,
  onClose,
  refinedScenarios,
  onSave,
  isSaving
}) => {
  const navigate = useNavigate();
  const [editableScenarios, setEditableScenarios] = useState<ExtendedScenarioItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('0');

  useEffect(() => {
    if (refinedScenarios.length > 0) {
      setEditableScenarios([...refinedScenarios]);
      setActiveTab('0');
    }
  }, [refinedScenarios]);

  const handleInputChange = (scenarioIndex: number, field: string, value: string | string[]) => {
    setEditableScenarios(prev => {
      const updated = [...prev];
      updated[scenarioIndex] = {
        ...updated[scenarioIndex],
        [field]: value
      };
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      // Convert ExtendedScenarioItem back to ScenarioItem when saving
      const scenariosToSave: ScenarioItem[] = editableScenarios.map(scenario => ({
        id: scenario.id,
        title: scenario.title,
        description: scenario.description,
        is_refined: true // Mark as refined when saving
      }));
      
      await onSave(scenariosToSave);
      toast({
        title: "Success",
        description: "Scenarios saved successfully",
      });
    } catch (error) {
      console.error('Error saving scenarios:', error);
      toast({
        title: "Error",
        description: "Failed to save scenarios. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleContinueToPlanBuild = () => {
    // Convert ExtendedScenarioItem back to ScenarioItem when navigating
    const scenariosToPass: ScenarioItem[] = editableScenarios.map(scenario => ({
      id: scenario.id,
      title: scenario.title,
      description: scenario.description,
      is_refined: true // Mark as refined when passing to next page
    }));
    
    navigate('/plan_build', { 
      state: { 
        scenarios: scenariosToPass,
        fromRefinement: true 
      } 
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Refined Scenarios</DialogTitle>
          <DialogDescription>
            Review and edit your refined scenarios before saving. You can make changes to any part of the scenarios.
          </DialogDescription>
        </DialogHeader>

        {editableScenarios.length > 0 ? (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-2 mb-4 w-full max-w-md mx-auto">
                {editableScenarios.map((_, index) => (
                  <TabsTrigger key={index} value={index.toString()}>
                    Scenario {index + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              {editableScenarios.map((scenario, scenarioIndex) => (
                <TabsContent key={scenarioIndex} value={scenarioIndex.toString()} className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`title-${scenarioIndex}`}>Title</Label>
                          <Input
                            id={`title-${scenarioIndex}`}
                            value={scenario.title}
                            onChange={(e) => handleInputChange(scenarioIndex, 'title', e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`description-${scenarioIndex}`}>Description</Label>
                          <Textarea
                            id={`description-${scenarioIndex}`}
                            value={scenario.description}
                            onChange={(e) => handleInputChange(scenarioIndex, 'description', e.target.value)}
                            rows={5}
                          />
                        </div>

                        {/* Handle optional extended fields */}
                        {('targetAudience' in scenario) && (
                          <div className="space-y-2">
                            <Label htmlFor={`targetAudience-${scenarioIndex}`}>Target Audience</Label>
                            <Input
                              id={`targetAudience-${scenarioIndex}`}
                              value={Array.isArray(scenario.targetAudience) 
                                ? scenario.targetAudience.join(', ') 
                                : ''}
                              onChange={(e) => handleInputChange(
                                scenarioIndex, 
                                'targetAudience', 
                                e.target.value.split(',').map(item => item.trim()).filter(Boolean)
                              )}
                            />
                          </div>
                        )}

                        {(scenario as ExtendedScenarioItem).strategicRationale && (
                          <div className="space-y-2">
                            <Label htmlFor={`strategicRationale-${scenarioIndex}`}>Strategic Rationale</Label>
                            <Textarea
                              id={`strategicRationale-${scenarioIndex}`}
                              value={(scenario as ExtendedScenarioItem).strategicRationale}
                              onChange={(e) => handleInputChange(scenarioIndex, 'strategicRationale', e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        {(scenario as ExtendedScenarioItem).theologicalJustification && (
                          <div className="space-y-2">
                            <Label htmlFor={`theologicalJustification-${scenarioIndex}`}>Theological Justification</Label>
                            <Textarea
                              id={`theologicalJustification-${scenarioIndex}`}
                              value={(scenario as ExtendedScenarioItem).theologicalJustification}
                              onChange={(e) => handleInputChange(scenarioIndex, 'theologicalJustification', e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        {(scenario as ExtendedScenarioItem).potentialChallengesBenefits && (
                          <div className="space-y-2">
                            <Label htmlFor={`potentialChallengesBenefits-${scenarioIndex}`}>Potential Challenges & Benefits</Label>
                            <Textarea
                              id={`potentialChallengesBenefits-${scenarioIndex}`}
                              value={(scenario as ExtendedScenarioItem).potentialChallengesBenefits}
                              onChange={(e) => handleInputChange(scenarioIndex, 'potentialChallengesBenefits', e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        {(scenario as ExtendedScenarioItem).successIndicators && (
                          <div className="space-y-2">
                            <Label htmlFor={`successIndicators-${scenarioIndex}`}>Success Indicators</Label>
                            <Textarea
                              id={`successIndicators-${scenarioIndex}`}
                              value={(scenario as ExtendedScenarioItem).successIndicators}
                              onChange={(e) => handleInputChange(scenarioIndex, 'successIndicators', e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}

                        {(scenario as ExtendedScenarioItem).impactOnCommunity && (
                          <div className="space-y-2">
                            <Label htmlFor={`impactOnCommunity-${scenarioIndex}`}>Impact on Community</Label>
                            <Textarea
                              id={`impactOnCommunity-${scenarioIndex}`}
                              value={(scenario as ExtendedScenarioItem).impactOnCommunity}
                              onChange={(e) => handleInputChange(scenarioIndex, 'impactOnCommunity', e.target.value)}
                              rows={3}
                            />
                          </div>
                        )}
                        
                        {/* Display any other properties that aren't part of the basic ScenarioItem */}
                        {Object.entries(scenario).map(([key, value]) => {
                          // Skip already handled properties and basic ScenarioItem properties
                          const basicProps = ['id', 'title', 'description', 'is_refined', 
                            'targetAudience', 'strategicRationale', 'theologicalJustification', 
                            'potentialChallengesBenefits', 'successIndicators', 'impactOnCommunity'];
                          
                          if (!basicProps.includes(key) && typeof value === 'string') {
                            return (
                              <div className="space-y-2" key={key}>
                                <Label htmlFor={`${key}-${scenarioIndex}`}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</Label>
                                <Textarea
                                  id={`${key}-${scenarioIndex}`}
                                  value={value}
                                  onChange={(e) => handleInputChange(scenarioIndex, key, e.target.value)}
                                  rows={3}
                                />
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </>
        ) : (
          <div className="flex justify-center items-center py-8">
            <p className="text-muted-foreground">No refined scenarios available.</p>
          </div>
        )}

        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <div className="flex gap-2">
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              variant="default"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Scenarios'
              )}
            </Button>
            <Button 
              onClick={handleContinueToPlanBuild}
              variant="default"
              className="bg-teal-600 hover:bg-teal-700 text-white"
              disabled={isSaving}
            >
              Continue to Plan Build
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
