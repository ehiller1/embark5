// src/components/research/ResearchSearch.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Loader2, FileText, MessageSquare } from "lucide-react";
import { SearchResult, PageType } from '@/types/research';

interface ResearchSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  results: SearchResult[];
  isLoading: boolean;
  onSaveResult: (result: SearchResult) => void;
  activeCategory: string | null;
  hasValidationError?: boolean;
  pageType: PageType;
}

export function ResearchSearch({
  query,
  onQueryChange,
  onSearch,
  results,
  isLoading,
  onSaveResult,
  activeCategory,
  hasValidationError = false,
  pageType,
}: ResearchSearchProps) {
  const [clickedResults, setClickedResults] = React.useState<string[]>([]);
  
  const handleResultClick = (result: SearchResult) => {
    console.log('[ResearchSearch] Result clicked:', {
      resultId: result.id,
      resultType: result.type,
      timestamp: new Date().toISOString()
    });
    // Add this result ID to the clickedResults array if not already there
    if (!clickedResults.includes(result.id)) {
      setClickedResults([...clickedResults, result.id]);
    }
    onSaveResult(result);
  };

  React.useEffect(() => {
    console.log('[ResearchSearch] Component state update:', {
      resultsCount: results.length,
      isLoading,
      hasValidationError,
      activeCategory,
      timestamp: new Date().toISOString()
    });
  }, [results, isLoading, hasValidationError, activeCategory]);

  const getPlaceholder = () => {
    if (hasValidationError) {
      return pageType === 'church_research'
        ? 'Church name and location are required'
        : 'Location is required';
    }
    return 'Enter your search query...';
  };

  return (
    <div className="h-full flex flex-col w-full">
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="text-base font-medium">Search Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col min-h-0">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={getPlaceholder()}
              disabled={hasValidationError}
              onKeyDown={(e) => e.key === 'Enter' && onSearch()}
              className="flex-1"
            />
            <Button
              onClick={onSearch}
              disabled={isLoading || hasValidationError}
              aria-label="Search"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {hasValidationError && (
            <p className="text-amber-600 text-sm">
              {pageType === 'church_research'
                ? 'Church name and location are required to search'
                : 'Location is required to search'}
            </p>
          )}

          {/* Let the scroll area fill remaining vertical space */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-4">
              {results.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  {activeCategory
                    ? 'Search for information about this category'
                    : 'Enter a search query to begin'}
                </div>
              )}

              {results.map((result) => (
                <Card
                  key={result.id}
                  className={`cursor-pointer transition-all ${clickedResults.includes(result.id) 
                    ? 'shadow-md bg-[#47799f]/20 border-[#47799f]' 
                    : 'hover:shadow-md hover:bg-accent/20 active:bg-accent/40'} 
                    focus:outline-none focus:ring-2 focus:ring-[#47799f] focus:ring-offset-2`}
                  onClick={() => handleResultClick(result)}
                >
                  <CardContent className="p-4 relative">
                    <div className="absolute inset-0 bg-[#47799f]/10 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity pointer-events-none"></div>
                    {result.type === 'ai' ? (
                      <>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-purple-700 flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            AI Insight
                          </h3>
                          <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                            AI
                          </span>
                        </div>
                        <p className="text-sm">{result.snippet}</p>
                        <div className="mt-2 text-xs text-blue-600">Click to add to notes</div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1 mb-1">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <h3 className="font-medium">{result.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{result.snippet}</p>
                        <div className="mt-2 text-xs text-blue-600">Click to add to notes</div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
