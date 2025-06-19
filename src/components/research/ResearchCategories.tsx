
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, List } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useResearchCategories, ResearchCategory } from '@/hooks/useResearchCategories';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export interface ResearchCategoriesProps {
  pageType: 'community_research' | 'church_research';
  activeCategory: string | null;
  onSelectCategory: (category: string, searchPrompt?: string) => void;
}

// Default search prompts for each category
const DEFAULT_SEARCH_PROMPTS: Record<string, Record<string, string>> = {
  community_research: {
    demographics: "demographics population statistics {location}",
    economy: "economic indicators business development {location}",
    education: "schools education system {location}",
    healthcare: "healthcare facilities medical services {location}",
    housing: "housing market real estate {location}",
    transportation: "public transit transportation infrastructure {location}",
    culture: "cultural events arts entertainment {location}",
    safety: "crime statistics public safety {location}",
    environment: "environmental conditions parks recreation {location}",
    social_services: "social services community programs {location}"
  },
  church_research: {
    history: "church history religious heritage {church_name} {location}",
    leadership: "church leadership pastoral staff {church_name} {location}",
    programs: "church programs ministries activities {church_name} {location}",
    community: "church community outreach involvement {church_name} {location}",
    worship: "worship services religious practices {church_name} {location}",
    facilities: "church facilities buildings property {church_name} {location}",
    membership: "church membership demographics {church_name} {location}",
    finances: "church finances budget stewardship {church_name} {location}",
    vision: "church vision mission statement {church_name} {location}",
    challenges: "church challenges opportunities {church_name} {location}"
  }
};

export function ResearchCategories({
  pageType,
  activeCategory,
  onSelectCategory,
}: ResearchCategoriesProps) {
  const { categories, loading } = useResearchCategories(pageType);

  React.useEffect(() => {
    console.log('[ResearchCategories] Component state:', {
      pageType,
      activeCategory,
      categoriesCount: categories.length,
      loading,
      timestamp: new Date().toISOString()
    });
  }, [pageType, activeCategory, categories.length, loading]);

  const handleCategorySelect = (category: ResearchCategory) => {
    console.log('[ResearchCategories] Category selected:', {
      categoryLabel: category.label,
      searchPrompt: category.search_prompt,
      timestamp: new Date().toISOString()
    });

    // Get the default search prompt for this category
    const categoryKey = category.label.toLowerCase().replace(/\s+/g, '_');
    const defaultPrompt = DEFAULT_SEARCH_PROMPTS[pageType][categoryKey] || 
                         `${category.label} ${pageType === 'church_research' ? '{church_name}' : ''} {location}`;
    
    // Use the database prompt if available, otherwise use the default
    const searchPrompt = category.search_prompt || defaultPrompt;
    
    // Pass both the category label AND the search prompt
    onSelectCategory(category.label, searchPrompt);
  };

  // Group categories by domain
  const groupedCategories = React.useMemo(() => {
    return categories.reduce<Record<string, ResearchCategory[]>>((acc, category) => {
      if (!acc[category.category_group]) {
        acc[category.category_group] = [];
      }
      acc[category.category_group].push(category);
      return acc;
    }, {});
  }, [categories]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-1">
          <List className="h-4 w-4" />
          Categories
        </CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <HelpCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Select a category to begin your research</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-24rem)]">
          <div className="space-y-4">
            {Object.entries(groupedCategories).map(([group, items]) => (
              <div key={group}>
                <h4 className="text-sm font-semibold text-muted-foreground mb-1 pl-2">{group}</h4>
                <div className="space-y-1">
                  {items.map((category) => (
                    <Button
                      key={category.id}
                      variant={activeCategory === category.label ? "secondary" : "ghost"}
                      className="w-full justify-start text-sm"
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category.label}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
            {Object.keys(groupedCategories).length === 0 && !loading && (
              <div className="text-center p-4 text-muted-foreground">
                No categories found for {pageType === 'church_research' ? 'church' : 'community'} research.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
