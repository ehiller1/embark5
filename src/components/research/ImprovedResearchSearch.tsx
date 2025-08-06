import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import {
  Search,
  FileText,
  MessageSquare,
  Plus,
  Loader2,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Globe,
  Brain,
} from 'lucide-react';
import { SearchResult } from '@/types/research';
import { ResearchAnnotationModal } from './ResearchAnnotationModal';

interface ImprovedResearchSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  results: SearchResult[];
  isLoading: boolean;
  activeCategory: string;
  hasValidationError: boolean;
  onAnnotationSave: (annotation: {
    content: string;
    notes: string;
    tags: string[];
    category: string;
  }) => void;
  savedResultIds: string[];
  totalSavedCount: number;
  onNext: () => void;
  location: string;
  onLocationChange: (location: string) => void;
}

export function ImprovedResearchSearch({
  query,
  onQueryChange,
  onSearch,
  results,
  isLoading,
  activeCategory,
  hasValidationError,
  onAnnotationSave,
  savedResultIds,
  totalSavedCount,
  onNext,
  location,
  onLocationChange,
}: ImprovedResearchSearchProps) {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('research_search_history');
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        console.error('Error loading search history:', e);
      }
    }
  }, []);

  // Save search to history
  const saveSearchToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updatedHistory = [
      searchQuery,
      ...searchHistory.filter(h => h !== searchQuery)
    ].slice(0, 5); // Keep only last 5 searches
    
    setSearchHistory(updatedHistory);
    localStorage.setItem('research_search_history', JSON.stringify(updatedHistory));
  };

  const handleSearch = () => {
    saveSearchToHistory(query);
    onSearch();
  };

  const handleAnnotateResult = (result: SearchResult) => {
    setSelectedResult(result);
    setIsAnnotationModalOpen(true);
  };

  const handleAnnotationSave = (annotation: any) => {
    onAnnotationSave(annotation);
    setIsAnnotationModalOpen(false);
    setSelectedResult(null);
  };

  const handleAnnotationSaveAndContinue = (annotation: any) => {
    onAnnotationSave(annotation);
    setIsAnnotationModalOpen(false);
    setSelectedResult(null);
    // Keep the search interface open for more searching
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'ai') {
      return <Brain className="h-4 w-4 text-purple-600" />;
    }
    return <Globe className="h-4 w-4 text-blue-600" />;
  };

  const getResultTypeLabel = (result: SearchResult) => {
    return result.type === 'ai' ? 'AI Insight' : 'Web Result';
  };

  const isResultSaved = (resultId: string) => {
    return savedResultIds.includes(resultId);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Search Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search for {activeCategory || "Community Information"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Search Location
            </label>
            <Input
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Enter city, state (e.g., Austin, TX)"
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Specify the location for your community research
            </p>
          </div>

          {/* Main Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Search Query
            </label>
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder={hasValidationError ? "Location is required" : "Enter your search query..."}
                disabled={hasValidationError}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch} 
                disabled={isLoading || hasValidationError}
                variant="default"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {hasValidationError && (
            <p className="text-amber-600 text-sm">
              Location is required to search
            </p>
          )}

          {/* Search History */}
          {searchHistory.length > 0 && !isLoading && results.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Recent Searches</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((historyQuery, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onQueryChange(historyQuery)}
                    className="text-xs"
                  >
                    {historyQuery}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Suggestions */}
          {!isLoading && results.length === 0 && activeCategory && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Lightbulb className="h-4 w-4" />
                Suggested searches for {activeCategory}
              </p>
              <div className="flex flex-wrap gap-2">
                {getSuggestedSearches(activeCategory).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => onQueryChange(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search Results */}
      {results.length > 0 && (
        <Card className="flex-1 min-h-0">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Search Results ({results.length})</span>
              <Badge variant="outline">
                {results.filter(r => isResultSaved(r.id)).length} saved
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="h-full min-h-0">
            <ScrollArea className="h-full">
              <div className="space-y-4">
                {results.map((result) => (
                  <Card
                    key={result.id}
                    className={`transition-all cursor-pointer ${
                      isResultSaved(result.id)
                        ? 'bg-green-50 border-green-200'
                        : 'hover:shadow-md hover:bg-accent/20'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getResultIcon(result)}
                            <Badge variant="outline" className="text-xs">
                              {getResultTypeLabel(result)}
                            </Badge>
                            {isResultSaved(result.id) && (
                              <Badge variant="default" className="text-xs bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Saved
                              </Badge>
                            )}
                          </div>
                          
                          {result.title && (
                            <h4 className="font-medium text-sm">{result.title}</h4>
                          )}
                          
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {result.snippet}
                          </p>
                          
                          {result.link && (
                            <a
                              href={result.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View source →
                            </a>
                          )}
                        </div>
                        
                        <Button
                          onClick={() => handleAnnotateResult(result)}
                          disabled={isResultSaved(result.id)}
                          variant={isResultSaved(result.id) ? "outline" : "default"}
                          size="sm"
                          className={!isResultSaved(result.id) ? "bg-primary hover:bg-primary/90" : ""}
                        >
                          {isResultSaved(result.id) ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-1" />
                              Annotate
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      {totalSavedCount > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {totalSavedCount} research items collected
              </div>
              <Button onClick={onNext} className="bg-primary hover:bg-primary/90">
                Review & Organize
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Annotation Modal */}
      <ResearchAnnotationModal
        open={isAnnotationModalOpen}
        onClose={() => {
          setIsAnnotationModalOpen(false);
          setSelectedResult(null);
        }}
        searchResult={selectedResult}
        activeCategory={activeCategory}
        onSave={handleAnnotationSave}
        onSaveAndContinue={handleAnnotationSaveAndContinue}
      />
    </div>
  );
}

// Helper function to get suggested searches based on category
function getSuggestedSearches(category: string): string[] {
  const suggestions: Record<string, string[]> = {
    'Demographics': [
      'population statistics',
      'age distribution',
      'income levels',
      'education levels',
      'ethnic diversity'
    ],
    'Housing': [
      'housing costs',
      'rental market',
      'home ownership rates',
      'housing development',
      'affordable housing'
    ],
    'Economy': [
      'local businesses',
      'employment rates',
      'major employers',
      'economic development',
      'business districts'
    ],
    'Transportation': [
      'public transit',
      'traffic patterns',
      'walkability',
      'bike infrastructure',
      'parking availability'
    ],
    'Education': [
      'school districts',
      'school ratings',
      'higher education',
      'educational programs',
      'literacy rates'
    ],
    'Healthcare': [
      'hospitals',
      'clinics',
      'health outcomes',
      'healthcare access',
      'mental health services'
    ],
    'Recreation': [
      'parks and recreation',
      'community centers',
      'sports facilities',
      'cultural venues',
      'entertainment options'
    ],
    'Safety': [
      'crime statistics',
      'police presence',
      'emergency services',
      'neighborhood watch',
      'safety initiatives'
    ]
  };

  return suggestions[category] || [
    'community resources',
    'local organizations',
    'neighborhood characteristics',
    'community needs',
    'local initiatives'
  ];
}
