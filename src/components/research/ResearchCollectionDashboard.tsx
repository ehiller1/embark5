import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  MessageSquare,
  Tag,
  Edit3,
  Trash2,
  MoreVertical,
  Search,
  Filter,
  ArrowRight,
  Download,
  Eye,
  Grid3X3,
  List,
  Plus,
} from 'lucide-react';
import { Note, SearchResult } from '@/types/research';

interface ResearchItem extends Note {
  tags: string[];
  source: 'web' | 'ai';
  sourceTitle?: string;
  sourceLink?: string;
}

interface ResearchCollectionDashboardProps {
  notes: Record<string, Note[]>;
  selectedResults?: SearchResult[];
  activeCategory?: string;
  onEditNote: (note: Note) => void;
  onDeleteNote: (category: string, noteId: string) => void;
  onAnnotateResult?: (result: SearchResult) => void;
  onNext: () => void;
  totalNoteCount: number;
}

export function ResearchCollectionDashboard({
  notes,
  selectedResults = [],
  activeCategory,
  onEditNote,
  onDeleteNote,
  onAnnotateResult,
  onNext,
  totalNoteCount,
}: ResearchCollectionDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filteredItems, setFilteredItems] = useState<ResearchItem[]>([]);

  // Convert notes and selected results to research items with enhanced metadata
  const allResearchItems: ResearchItem[] = React.useMemo(() => {
    const items: ResearchItem[] = [];
    
    // Add saved notes
    Object.entries(notes).forEach(([category, categoryNotes]) => {
      categoryNotes.forEach(note => {
        const tags = note.metadata?.tags || [];
        const source = note.metadata?.source || 'web';
        const sourceTitle = note.metadata?.sourceTitle;
        const sourceLink = note.metadata?.sourceLink;
        
        items.push({
          ...note,
          tags,
          source,
          sourceTitle,
          sourceLink,
        });
      });
    });
    
    // Add selected results that haven't been saved yet
    selectedResults.forEach(result => {
      // Check if this result is already saved as a note
      const isAlreadySaved = items.some(item => 
        item.content.includes(result.snippet) || 
        (result.title && item.content.includes(result.title))
      );
      
      if (!isAlreadySaved) {
        const selectedItem: ResearchItem = {
          id: `selected-${result.id}`,
          content: result.snippet,
          category: activeCategory || 'selected',
          timestamp: new Date().toISOString(),
          tags: ['selected'],
          source: result.type === 'ai' ? 'ai' : 'web',
          sourceTitle: result.title,
          sourceLink: result.link,
          metadata: {
            isSelected: true,
            originalResult: result
          }
        };
        items.push(selectedItem);
      }
    });
    
    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notes, selectedResults, activeCategory]);

  // Get all unique tags
  const allTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    allResearchItems.forEach(item => {
      item.tags.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [allResearchItems]);

  // Get all categories
  const allCategories = React.useMemo(() => {
    const categories = new Set(Object.keys(notes));
    if (selectedResults.length > 0) {
      categories.add('selected');
    }
    return Array.from(categories).sort();
  }, [notes]);

  // Filter items based on search and filters
  useEffect(() => {
    let filtered = allResearchItems;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.content.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        (item.sourceTitle && item.sourceTitle.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(item => item.tags.includes(selectedTag));
    }

    setFilteredItems(filtered);
  }, [allResearchItems, searchQuery, selectedCategory, selectedTag]);

  const handleExportSummary = () => {
    // Create a summary of all research
    const summary = allCategories.map(category => {
      const categoryItems = allResearchItems.filter(item => item.category === category);
      return {
        category,
        count: categoryItems.length,
        items: categoryItems.map(item => ({
          content: item.content,
          tags: item.tags,
          timestamp: item.timestamp,
        }))
      };
    });

    // Create downloadable text file
    const summaryText = summary.map(cat => 
      `## ${cat.category} (${cat.count} items)\n\n` +
      cat.items.map(item => 
        `- ${item.content}\n  Tags: ${item.tags.join(', ')}\n  Date: ${new Date(item.timestamp).toLocaleDateString()}\n`
      ).join('\n')
    ).join('\n\n');

    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `community-research-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Research Collection</h2>
            <p className="text-muted-foreground">
              Review and organize your {totalNoteCount} research items
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportSummary}>
              <Download className="h-4 w-4 mr-2" />
              Export Summary
            </Button>
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search research items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {allCategories.map(category => {
                const count = category === 'selected' 
                  ? selectedResults.length 
                  : (notes[category]?.length || 0);
                return (
                  <SelectItem key={category} value={category}>
                    {category} ({count})
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Research Items */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {searchQuery || selectedCategory !== 'all' || selectedTag !== 'all' 
                  ? 'No research items match your filters'
                  : 'No research items yet. Start by searching and annotating content.'
                }
              </div>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-4'
            }>
              {filteredItems.map((item) => (
                <Card key={item.id} className={`group hover:shadow-md transition-shadow ${
                  item.metadata?.isSelected ? 'border-blue-300 bg-blue-50/50' : ''
                }`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {item.source === 'ai' ? (
                          <MessageSquare className="h-4 w-4 text-purple-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-600" />
                        )}
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      {item.metadata?.isSelected ? (
                        <Button 
                          size="sm" 
                          onClick={() => onAnnotateResult?.(item.metadata.originalResult)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Annotate
                        </Button>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEditNote(item)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {item.sourceLink && (
                              <DropdownMenuItem asChild>
                                <a href={item.sourceLink} target="_blank" rel="noopener noreferrer">
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Source
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => onDeleteNote(item.category, item.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm line-clamp-3">{item.content}</p>
                    
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatDate(item.timestamp)}</span>
                      {item.sourceTitle && (
                        <span className="truncate max-w-[150px]" title={item.sourceTitle}>
                          {item.sourceTitle}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 pt-6 border-t">
        <div className="text-sm text-muted-foreground text-center">
          Showing {filteredItems.length} of {totalNoteCount} research items
        </div>
      </div>
    </div>
  );
}
