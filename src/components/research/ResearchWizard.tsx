import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { ImprovedResearchSearch } from './ImprovedResearchSearch';
import { ResearchCollectionDashboard } from './ResearchCollectionDashboard';
import { SearchResult, Note } from '@/types/research';
import { useToast } from '@/hooks/use-toast';

interface ResearchWizardProps {
  activeCategory: string;
  searchPrompt: string;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  results: SearchResult[];
  isLoading: boolean;
  hasValidationError: boolean;
  notes: Record<string, Note[]>;
  onSaveNote: (content: string, category: string, metadata?: any) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (category: string, noteId: string) => void;
  onNext: () => void;
  totalNoteCount: number;
  location: string;
  onLocationChange: (location: string) => void;
}

type WizardStep = 'search' | 'review';

export function ResearchWizard({
  activeCategory,
  searchPrompt,
  query,
  onQueryChange,
  onSearch,
  results,
  isLoading,
  hasValidationError,
  notes,
  onSaveNote,
  onEditNote,
  onDeleteNote,
  onNext,
  totalNoteCount,
  location,
  onLocationChange,
}: ResearchWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('search');
  const [savedResultIds, setSavedResultIds] = useState<string[]>([]);
  const { toast } = useToast();

  // Load saved result IDs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('research_saved_results');
    if (saved) {
      try {
        setSavedResultIds(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved results:', e);
      }
    }
  }, []);

  // Save result IDs to localStorage
  const updateSavedResults = (newIds: string[]) => {
    setSavedResultIds(newIds);
    localStorage.setItem('research_saved_results', JSON.stringify(newIds));
  };

  const handleAnnotationSave = (annotation: {
    content: string;
    notes: string;
    tags: string[];
    category: string;
  }) => {
    // Find the original search result to get metadata
    const originalResult = results.find(r => r.snippet === annotation.content);
    
    const metadata = {
      tags: annotation.tags,
      source: originalResult?.type || 'web',
      sourceTitle: originalResult?.title,
      sourceLink: originalResult?.link,
    };

    // Save the note with enhanced metadata
    onSaveNote(annotation.notes, annotation.category, metadata);

    // Mark this result as saved
    if (originalResult) {
      const newSavedIds = [...savedResultIds, originalResult.id];
      updateSavedResults(newSavedIds);
    }

    toast({
      title: 'Research Item Saved',
      description: 'Your annotated research has been added to your collection.',
    });
  };

  const handleStepChange = (step: WizardStep) => {
    setCurrentStep(step);
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case 'search':
        return 50;
      case 'review':
        return 100;
      default:
        return 0;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'search':
        return 'Research & Discovery';
      case 'review':
        return 'Review & Organize';
      default:
        return 'Community Research';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'search':
        return 'Search for information and annotate relevant findings for your community assessment.';
      case 'review':
        return 'Review your collected research items and organize them before proceeding.';
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Wizard Header */}
      <div className="flex-shrink-0 mb-6">
        <Card>
          <CardContent className="pt-6">
            {/* Step Navigation */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant={currentStep === 'search' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStepChange('search')}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Research</span>
                  <span className="sm:hidden">1</span>
                </Button>
                
                <div className="w-8 h-px bg-border" />
                
                <Button
                  variant={currentStep === 'review' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStepChange('review')}
                  disabled={totalNoteCount === 0}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Review</span>
                  <span className="sm:hidden">2</span>
                  {totalNoteCount > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {totalNoteCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Category Badge */}
              <Badge variant="outline" className="text-sm">
                {activeCategory || 'Select Category'}
              </Badge>
            </div>

            {/* Unified Progress Indicator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-lg">{getStepTitle()}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getStepDescription()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">
                    {totalNoteCount} research items collected
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Step {currentStep === 'search' ? '1' : '2'} of 2
                  </div>
                </div>
              </div>
              
              {/* Combined Progress Bar */}
              <div className="space-y-1">
                <Progress 
                  value={currentStep === 'search' ? Math.min((totalNoteCount / 5) * 50, 50) : 100} 
                  className="h-2" 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Research & Discovery</span>
                  <span>Review & Organize</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Step Content */}
      <div className="flex-1 min-h-0">
        {currentStep === 'search' && (
          <ImprovedResearchSearch
            query={query}
            onQueryChange={onQueryChange}
            onSearch={onSearch}
            results={results}
            isLoading={isLoading}
            activeCategory={activeCategory}
            hasValidationError={hasValidationError}
            onAnnotationSave={handleAnnotationSave}
            savedResultIds={savedResultIds}
            totalSavedCount={totalNoteCount}
            onNext={() => handleStepChange('review')}
            location={location}
            onLocationChange={onLocationChange}
          />
        )}

        {currentStep === 'review' && (
          <ResearchCollectionDashboard
            notes={notes}
            onEditNote={onEditNote}
            onDeleteNote={onDeleteNote}
            onNext={onNext}
            totalNoteCount={totalNoteCount}
          />
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex-shrink-0 pt-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {currentStep === 'review' && (
                  <Button
                    variant="outline"
                    onClick={() => handleStepChange('search')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Search
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {totalNoteCount} research items collected
                </div>
                
                {currentStep === 'search' && totalNoteCount > 0 && (
                  <Button
                    onClick={() => handleStepChange('review')}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Review Items
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                
                {currentStep === 'review' && (
                  <Button
                    onClick={onNext}
                    disabled={totalNoteCount === 0}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Continue to Assessment
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
