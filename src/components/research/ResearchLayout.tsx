
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { HelpCircle, FileText } from "lucide-react";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ResearchStep {
  number: number;
  title: string;
  description: string;
}

const RESEARCH_STEPS: ResearchStep[] = [
  {
    number: 1,
    title: "Search",
    description: "Search and gather information from different sources"
  },
  {
    number: 2,
    title: "Save Notes",
    description: "Save important findings to your research notes"
  },
  {
    number: 3,
    title: "Generate Summary",
    description: "Create a comprehensive research summary"
  }
];

interface ResearchLayoutProps {
  title: string;
  locationName?: string;
  children: React.ReactNode;
  breadcrumbs: Array<{
    name: string;
    href?: string;
  }>;
}

export function ResearchLayout({
  title,
  locationName,
  children,
  breadcrumbs
}: ResearchLayoutProps) {
  return (
    <div className="flex flex-col h-full space-y-4 p-6 max-w-full mx-auto">
      {/* Navigation and Context */}
      <div className="flex justify-between items-center">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.name}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.name}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        
        {locationName && (
          <div className="text-sm text-muted-foreground flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Location: {locationName || "Not specified"}
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
              <Button variant="ghost" size="icon">
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/50 p-4 rounded-lg">
        {RESEARCH_STEPS.map((step) => (
          <div
            key={step.number}
            className="relative flex flex-col items-center p-4 bg-card rounded-lg border shadow-sm"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {step.number}
            </div>
            <h3 className="mt-2 font-medium text-base">{step.title}</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 w-full">
        {children}
      </div>
    </div>
  );
}
