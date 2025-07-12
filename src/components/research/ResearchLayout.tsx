// src/components/ResearchLayout.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { HelpCircle, FileText } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ResearchStep {
  number: number;
  title: string;
  description: string;
}

const RESEARCH_STEPS: ResearchStep[] = [
  { number: 1, title: "Select",         description: "Select a unique focus that will guide your conversation companion in clarifying your search results as you discern.." },
  { number: 2, title: "Search",         description: "Enter specific search criteria that relates to your ongoing discernment - be as specific as possible so that your conversation companion can be most helpful." },
  { number: 3, title: "Save Notes",     description: "You are encouraged to save important information as you continue to discern so that your research summary is comprehensive." },
  { number: 4, title: "Generate Summary", description: "Create a comprehensive research summary based on your individual inquiries that is also informed by your community surveys." }
];

interface ResearchLayoutProps {
  title: string;
  locationName?: string;
  children: React.ReactNode;
}

export function ResearchLayout({
  title,
  locationName,
  children
}: ResearchLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full max-w-[1800px] mx-auto">
      {/* Fixed header content */}
      <div className="space-y-4 p-6 pb-2 flex-shrink-0">
        {/* Context */}
        <div className="flex justify-between items-center">
          {locationName && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Location: {locationName}
            </div>
          )}
        </div>

        {/* Title and Help */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif font-semibold bg-clip-text text-transparent bg-gradient-journey">
            {title}
          </h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="text-[#47799f] hover:text-[#3a6380]">
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search, save notes, and generate a research summary</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress Steps */}
        <div className="bg-gradient-to-r from-[#f8f2e0]/50 to-[#D6E4F0]/50 p-4 rounded-lg shadow-journey-sm">
          <div className="grid grid-cols-4 gap-2">
            {RESEARCH_STEPS.map((step) => (
              <div
                key={step.number}
                className="group flex flex-col bg-white rounded-lg border border-[#47799f]/20 shadow-journey p-3 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-5 h-5 rounded-full bg-[#47799f] text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {step.number}
                  </div>
                  <h3 className="font-medium text-sm truncate text-[#47799f]">{step.title}</h3>
                </div>
                <div className="relative">
                  <p className="text-xs text-muted-foreground line-clamp-2 group-hover:line-clamp-none transition-all duration-200">
                    {step.description}
                  </p>
                  <div className="absolute bottom-0 right-0 bg-gradient-to-l from-white to-transparent w-8 h-full pointer-events-none"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content - Scrollable area */}
      <div className="flex-1 px-6 pb-6 pt-2 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
