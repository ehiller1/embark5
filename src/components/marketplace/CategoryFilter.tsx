import React from 'react';
import { ServiceCategory } from '@/types/marketplace';
import { Badge } from '@/components/ui/badge';
import * as LucideIcons from 'lucide-react';

interface CategoryFilterProps {
  categories: ServiceCategory[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  // Add an "All Categories" option
  const allCategories = [
    { id: '', name: 'All Categories', icon: 'grid' },
    ...categories,
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Categories</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {allCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.id)}
              className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-accent'
              }`}
            >
              <div className="flex items-center">
                {category.icon && (
                  <div className="mr-3 flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    {renderIcon(category.icon)}
                  </div>
                )}
                <span>{category.name}</span>
              </div>
              {category.id && (
                <Badge variant="secondary" className="ml-2">
                  {Math.floor(Math.random() * 50) + 10}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Re-export Card components for convenience
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-card text-card-foreground rounded-lg border ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ className = '', children }: { className?: string; children: React.ReactNode }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

// Helper function to render icons dynamically from Lucide
const renderIcon = (iconName: string) => {
  // Convert icon name to PascalCase for Lucide component naming convention
  const pascalCaseName = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
  
  // Try to get the icon component from Lucide
  const IconComponent = (LucideIcons as any)[pascalCaseName];
  
  // If the icon exists in Lucide, render it; otherwise, use a default icon
  if (IconComponent) {
    return <IconComponent className="h-4 w-4" />;
  }
  
  // Fallback to Grid icon if the specified icon doesn't exist
  return <LucideIcons.Grid className="h-4 w-4" />;
};

export default CategoryFilter;
