// src/components/ResearchPageHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export interface ResearchPageHeaderProps {
  // breadcrumbs removed
  title: string;
  intro?: string;
}

export const ResearchPageHeader: React.FC<ResearchPageHeaderProps> = ({
  title,
  intro,
}) => {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </div>
      <h1 className="text-3xl font-semibold mt-4">{title}</h1>
      {intro && <p className="text-sm text-muted-foreground mt-1">{intro}</p>}
    </div>
  );
};
