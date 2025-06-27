import * as React from "react";
import { useState } from 'react';
import { useParishCompanion } from '@/hooks/useParishCompanion';
import { ParishCompanionsList } from './ParishCompanionsList';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';

interface AssessmentSidebarProps {
  children: React.ReactNode;
}

export function AssessmentSidebar({ children }: AssessmentSidebarProps) {
  const [open, setOpen] = useState(false);
  const { } = useParishCompanion();
  
  return (
    <SidebarProvider defaultOpen={false} open={open} onOpenChange={setOpen}>
      <div className="flex w-full min-h-screen">
        <Sidebar variant="inset" collapsible="offcanvas" className="border-r">
          <SidebarContent>
            <div className="px-2 py-3 text-sm text-center font-medium text-journey-darkRed border-b border-journey-pink/20">
              <div className="flex items-center justify-center space-x-1.5">
                <RefreshCcw className="h-3.5 w-3.5" />
                <span className="text-xs">Switch Your Companion</span>
              </div>
            </div>
            <SidebarGroup>
              <SidebarGroupContent>
                <ParishCompanionsList />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
        
        <div className="flex flex-col w-full min-h-screen">
          <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-10 md:flex hidden">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setOpen(!open)}
              className="rounded-l-none bg-white shadow-md border border-l-0 h-14 w-6"
            >
              {open ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
          
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
