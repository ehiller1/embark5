// src/components/ResearchPageHeader.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export interface ResearchPageHeaderProps {
  breadcrumbs: { name: string; href?: string }[];
  title: string;
  intro?: string;
}

export const ResearchPageHeader: React.FC<ResearchPageHeaderProps> = ({
  breadcrumbs,
  title,
  intro,
}) => {
  const navigate = useNavigate();
  return (
    <div className="mb-6">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.name}>
                <BreadcrumbItem>
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>{crumb.name}</BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {idx < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <h1 className="text-3xl font-semibold mt-4">{title}</h1>
      {intro && <p className="text-sm text-muted-foreground mt-1">{intro}</p>}
    </div>
  );
};
